import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ColdChainService {
  constructor(private prisma: PrismaService) {}

  async listLogs(tenantId: string, opts?: { branchId?: string }) {
    try {
      return await (this.prisma as any).coldChainLog.findMany({
        where: { tenantId, ...(opts?.branchId ? { branchId: opts.branchId } : {}) },
        orderBy: { logDate: 'desc' },
        take: 200,
      });
    } catch { return []; }
  }

  async createLog(tenantId: string, dto: any) {
    if (!dto.logDate) throw new BadRequestException('logDate is required');
    if (!dto.timeChecked) throw new BadRequestException('timeChecked is required');
    if (dto.temperatureReading == null) throw new BadRequestException('temperatureReading is required');
    if (dto.minAcceptableTemp == null || dto.maxAcceptableTemp == null) {
      throw new BadRequestException('minAcceptableTemp and maxAcceptableTemp are required');
    }
    if (!dto.checkedByUserId) throw new BadRequestException('checkedByUserId is required');

    const temp = Number(dto.temperatureReading);
    const min = Number(dto.minAcceptableTemp);
    const max = Number(dto.maxAcceptableTemp);
    const isWithinRange = temp >= min && temp <= max;

    return (this.prisma as any).coldChainLog.create({
      data: {
        tenantId,
        branchId: dto.branchId || null,
        logDate: new Date(dto.logDate),
        timeChecked: dto.timeChecked,
        containerType: dto.containerType || 'refrigerator_2_8',
        temperatureReading: temp,
        minAcceptableTemp: min,
        maxAcceptableTemp: max,
        isWithinRange,
        correctionTaken: !isWithinRange ? (dto.correctionTaken || null) : null,
        checkedByUserId: dto.checkedByUserId,
        notes: dto.notes || null,
      },
    });
  }
}
