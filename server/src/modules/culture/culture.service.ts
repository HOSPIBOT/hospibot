import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CultureService {
  constructor(private prisma: PrismaService) {}

  async listCultures(tenantId: string, opts?: { status?: string }) {
    try {
      return await (this.prisma as any).cultureTracking.findMany({
        where: {
          tenantId,
          ...(opts?.status ? { growthStatus: opts.status } : {}),
        },
        orderBy: { inoculatedAt: 'desc' },
        take: 200,
      });
    } catch { return []; }
  }

  async createCulture(tenantId: string, dto: any) {
    if (!dto.specimenType) throw new BadRequestException('specimenType is required');
    if (!dto.cultureMedia) throw new BadRequestException('cultureMedia is required');
    if (!dto.technicianUserId) throw new BadRequestException('technicianUserId is required');

    return (this.prisma as any).cultureTracking.create({
      data: {
        tenantId,
        labOrderId: dto.labOrderId || null,
        patientId: dto.patientId || null,
        specimenType: dto.specimenType,
        specimenSource: dto.specimenSource || null,
        cultureMedia: dto.cultureMedia,
        inoculatedAt: dto.inoculatedAt ? new Date(dto.inoculatedAt) : new Date(),
        growthStatus: 'INCUBATING',
        technicianUserId: dto.technicianUserId,
        notes: dto.notes || null,
      },
    });
  }

  async updateGrowth(tenantId: string, id: string, dto: any) {
    const row = await (this.prisma as any).cultureTracking.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Culture not found');

    const validStatuses = ['INCUBATING', 'NO_GROWTH', 'GROWTH_DETECTED', 'IDENTIFIED', 'FINAL'];
    if (dto.growthStatus && !validStatuses.includes(dto.growthStatus)) {
      throw new BadRequestException(`Invalid status: ${dto.growthStatus}`);
    }

    return (this.prisma as any).cultureTracking.update({
      where: { id },
      data: {
        ...(dto.growthStatus ? { growthStatus: dto.growthStatus } : {}),
        ...(dto.growthStatus === 'NO_GROWTH' || dto.growthStatus === 'GROWTH_DETECTED' || dto.growthStatus === 'IDENTIFIED' || dto.growthStatus === 'FINAL'
          ? { readAt: new Date() } : {}),
        ...(dto.organismIdentified ? { organismIdentified: dto.organismIdentified } : {}),
        ...(dto.colonyCount ? { colonyCount: dto.colonyCount } : {}),
        ...(dto.incubationHours != null ? { incubationHours: Number(dto.incubationHours) } : {}),
        ...(dto.isFlaggedMdro != null ? { isFlaggedMdro: !!dto.isFlaggedMdro } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
      },
    });
  }
}
