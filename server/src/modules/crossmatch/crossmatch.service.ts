import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * CrossmatchService — Blood compatibility testing register.
 *
 * Regulatory references:
 *   - D&C Rules 1945, Schedule F Part XII-B — Issue Register fields
 *   - NACO Standards — ABO compatibility + antiglobulin test requirement
 *   - NBTC — crossmatch must demonstrate ABO incompatibility and
 *     clinically significant unexpected antibodies
 *
 * ABO compatibility is validated SERVER-SIDE — incompatible combinations
 * are flagged but still recorded (for "least incompatible" emergency use
 * under medical officer authorization per NACO guidelines).
 */

// ABO compatibility matrix (for PRBC/Whole Blood — cellular products)
// Key: donor group → Set of compatible recipient groups
const ABO_COMPAT: Record<string, Set<string>> = {
  'O':  new Set(['O', 'A', 'B', 'AB']),
  'A':  new Set(['A', 'AB']),
  'B':  new Set(['B', 'AB']),
  'AB': new Set(['AB']),
};

// Rh compatibility: Rh- can go to Rh+ or Rh-; Rh+ only to Rh+
function isRhCompatible(donorRh: string, recipientRh: string): boolean {
  if (donorRh === 'NEGATIVE') return true; // Rh- is universal for Rh
  return recipientRh === 'POSITIVE'; // Rh+ donor only to Rh+ recipient
}

function checkAboCompatibility(
  donorGroup: string, donorRh: string,
  recipientGroup: string, recipientRh: string,
  componentType: string,
): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // For plasma products (FFP, Cryo) — reverse ABO compatibility
  if (componentType === 'FFP' || componentType === 'CRYO') {
    const plasmaCompat: Record<string, Set<string>> = {
      'AB': new Set(['O', 'A', 'B', 'AB']),
      'A':  new Set(['A', 'O']),
      'B':  new Set(['B', 'O']),
      'O':  new Set(['O']),
    };
    if (!plasmaCompat[donorGroup]?.has(recipientGroup)) {
      warnings.push(`ABO INCOMPATIBLE: ${donorGroup} plasma → ${recipientGroup} recipient`);
    }
  } else {
    // Cellular products (Whole Blood, PRBC, Platelets)
    if (!ABO_COMPAT[donorGroup]?.has(recipientGroup)) {
      warnings.push(`ABO INCOMPATIBLE: ${donorGroup} donor → ${recipientGroup} recipient`);
    }
  }

  if (!isRhCompatible(donorRh, recipientRh)) {
    warnings.push(`Rh INCOMPATIBLE: ${donorRh} donor → ${recipientRh} recipient`);
  }

  return { compatible: warnings.length === 0, warnings };
}

@Injectable()
export class CrossmatchService {
  constructor(private prisma: PrismaService) {}

  async listRecords(tenantId: string, opts?: { result?: string }) {
    try {
      return await (this.prisma as any).crossmatchRecord.findMany({
        where: {
          tenantId,
          ...(opts?.result ? { finalResult: opts.result } : {}),
        },
        orderBy: { requestDate: 'desc' },
        take: 200,
      });
    } catch { return []; }
  }

  async createRecord(tenantId: string, dto: any) {
    // Validate required fields per D&C Rules Issue Register
    const required = ['bagSerialNumber', 'donorBloodGroup', 'donorRhFactor',
      'quantityMl', 'componentType', 'recipientName', 'recipientBloodGroup',
      'recipientRhFactor', 'indicationForTransfusion', 'immediateSpinResult',
      'testedByUserId'];
    for (const f of required) {
      if (!dto[f] && dto[f] !== 0) throw new BadRequestException(`${f} is required`);
    }

    // Validate enums
    const validGroups = ['A', 'B', 'AB', 'O'];
    const validRh = ['POSITIVE', 'NEGATIVE'];
    if (!validGroups.includes(dto.donorBloodGroup)) throw new BadRequestException('Invalid donor blood group');
    if (!validGroups.includes(dto.recipientBloodGroup)) throw new BadRequestException('Invalid recipient blood group');
    if (!validRh.includes(dto.donorRhFactor)) throw new BadRequestException('Invalid donor Rh factor');
    if (!validRh.includes(dto.recipientRhFactor)) throw new BadRequestException('Invalid recipient Rh factor');

    // Server-side ABO compatibility check (NACO requirement)
    const { compatible, warnings } = checkAboCompatibility(
      dto.donorBloodGroup, dto.donorRhFactor,
      dto.recipientBloodGroup, dto.recipientRhFactor,
      dto.componentType,
    );

    // Determine final result
    let finalResult = dto.finalResult || 'COMPATIBLE';
    if (dto.immediateSpinResult === 'INCOMPATIBLE') {
      finalResult = 'INCOMPATIBLE';
    } else if (!compatible) {
      finalResult = 'INCOMPATIBLE';
    } else if (dto.iatCoombsResult === 'INCOMPATIBLE') {
      finalResult = 'INCOMPATIBLE';
    }

    // Auto-generate serial number
    const serialNumber = dto.serialNumber
      || `XM-${Date.now().toString(36).toUpperCase()}`;

    try {
      return await (this.prisma as any).crossmatchRecord.create({
        data: {
          tenantId,
          serialNumber,
          requestDate: dto.requestDate ? new Date(dto.requestDate) : new Date(),
          bagSerialNumber: dto.bagSerialNumber.trim(),
          donorBloodGroup: dto.donorBloodGroup,
          donorRhFactor: dto.donorRhFactor,
          quantityMl: Number(dto.quantityMl),
          componentType: dto.componentType,
          recipientName: dto.recipientName.trim(),
          recipientBloodGroup: dto.recipientBloodGroup,
          recipientRhFactor: dto.recipientRhFactor,
          recipientHospital: dto.recipientHospital?.trim() || null,
          recipientWard: dto.recipientWard?.trim() || null,
          indicationForTransfusion: dto.indicationForTransfusion,
          immediateSpinResult: dto.immediateSpinResult,
          iatCoombsResult: dto.iatCoombsResult || null,
          antibodyScreenResult: dto.antibodyScreenResult || null,
          antibodyIdentified: dto.antibodyIdentified?.trim() || null,
          finalResult,
          testedByUserId: dto.testedByUserId,
          issuedByName: dto.issuedByName?.trim() || null,
          medicalOfficerName: dto.medicalOfficerName?.trim() || null,
          notes: warnings.length > 0
            ? `[AUTO] ${warnings.join('; ')}${dto.notes ? '. ' + dto.notes : ''}`
            : dto.notes?.trim() || null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new BadRequestException(`Serial number ${serialNumber} already exists`);
      throw err;
    }
  }

  async issueUnit(tenantId: string, id: string, dto: { issuedByName: string }) {
    const row = await (this.prisma as any).crossmatchRecord.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Crossmatch record not found');
    if (row.finalResult === 'INCOMPATIBLE') {
      throw new BadRequestException('Cannot issue an INCOMPATIBLE unit without medical officer override');
    }
    return (this.prisma as any).crossmatchRecord.update({
      where: { id },
      data: { issuedAt: new Date(), issuedByName: dto.issuedByName },
    });
  }
}
