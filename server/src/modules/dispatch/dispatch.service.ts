import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  /**
   * List dispatch manifests for a tenant, most recent first.
   */
  async listManifests(tenantId: string, opts?: { branchId?: string; status?: string }) {
    try {
      return await (this.prisma as any).dispatchManifest.findMany({
        where: {
          tenantId,
          ...(opts?.branchId ? { branchId: opts.branchId } : {}),
          ...(opts?.status ? { status: opts.status } : {}),
        },
        orderBy: { dispatchDate: 'desc' },
        take: 200,
      });
    } catch {
      return [];
    }
  }

  /**
   * Get a single manifest by ID (tenant-scoped).
   */
  async getManifest(tenantId: string, id: string) {
    const row = await (this.prisma as any).dispatchManifest.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Dispatch manifest not found');
    return row;
  }

  /**
   * Create a new dispatch manifest. Auto-generates manifestNumber if not provided.
   */
  async createManifest(tenantId: string, dto: any) {
    if (!dto.dispatchDate) throw new BadRequestException('dispatchDate is required');
    if (!dto.destinationLabName) throw new BadRequestException('destinationLabName is required');
    if (!dto.sampleCount || dto.sampleCount < 1) throw new BadRequestException('sampleCount must be >= 1');
    if (!dto.dispatchedByUserId) throw new BadRequestException('dispatchedByUserId is required');

    const manifestNumber = dto.manifestNumber
      || `DM-${Date.now().toString(36).toUpperCase()}`;

    try {
      return await (this.prisma as any).dispatchManifest.create({
        data: {
          tenantId,
          branchId: dto.branchId || null,
          manifestNumber,
          dispatchDate: new Date(dto.dispatchDate),
          destinationLabName: dto.destinationLabName,
          transporterName: dto.transporterName || null,
          sampleCount: Number(dto.sampleCount),
          temperatureAtDispatch: dto.temperatureAtDispatch != null ? Number(dto.temperatureAtDispatch) : null,
          containerType: dto.containerType || null,
          status: 'PACKING',
          dispatchedByUserId: dto.dispatchedByUserId,
          notes: dto.notes || null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException(`Manifest number ${manifestNumber} already exists for this tenant`);
      }
      throw err;
    }
  }

  /**
   * Update dispatch status (e.g., PACKING → DISPATCHED → RECEIVED).
   */
  async updateStatus(tenantId: string, id: string, dto: { status: string; receivedByName?: string }) {
    const row = await (this.prisma as any).dispatchManifest.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Dispatch manifest not found');

    const validTransitions: Record<string, string[]> = {
      PACKING: ['DISPATCHED'],
      DISPATCHED: ['IN_TRANSIT', 'RECEIVED', 'REJECTED'],
      IN_TRANSIT: ['RECEIVED', 'REJECTED'],
    };

    const allowed = validTransitions[row.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${row.status} to ${dto.status}`);
    }

    const isReceived = dto.status === 'RECEIVED';
    return (this.prisma as any).dispatchManifest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(isReceived ? { receivedAt: new Date(), receivedByName: dto.receivedByName || null } : {}),
      },
    });
  }
}
