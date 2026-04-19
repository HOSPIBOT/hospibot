import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ESH 2024 / ACC-AHA thresholds
// Hypertension: 24h >=130/80, Day >=135/85, Night >=120/70
// Dipping: Normal (10-20%), Non-dipper (<10%), Extreme dipper (>20%), Riser (<0%)

@Injectable()
export class AbpmReportsService {
  private readonly logger = new Logger(AbpmReportsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, dippingStatus, bpPhenotype, status, search } = query;
      const where: any = { tenantId };
      if (dippingStatus) where.dippingStatus = dippingStatus;
      if (bpPhenotype) where.bpPhenotype = bpPhenotype;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.abpmReport.findMany({ where, orderBy: { studyDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.abpmReport.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.abpmReport.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');

      // Auto-classify dipping status
      const daySbp = dto.daytimeAvgSbp ? Number(dto.daytimeAvgSbp) : null;
      const nightSbp = dto.nighttimeAvgSbp ? Number(dto.nighttimeAvgSbp) : null;
      let dippingPct = null;
      let dippingStatus = null;
      if (daySbp && nightSbp) {
        dippingPct = Math.round(((daySbp - nightSbp) / daySbp) * 100 * 10) / 10;
        if (dippingPct < 0) dippingStatus = 'Riser';
        else if (dippingPct < 10) dippingStatus = 'Non-Dipper';
        else if (dippingPct <= 20) dippingStatus = 'Normal Dipper';
        else dippingStatus = 'Extreme Dipper';
      }

      // Auto-classify BP phenotype (ESH 2024)
      const officeSbp = dto.officeSbp ? Number(dto.officeSbp) : null;
      const avgSbp24 = dto.avg24hSbp ? Number(dto.avg24hSbp) : null;
      let bpPhenotype = null;
      if (officeSbp && avgSbp24) {
        const officeHigh = officeSbp >= 140;
        const abpmHigh = avgSbp24 >= 130;
        if (officeHigh && abpmHigh) bpPhenotype = 'Sustained Hypertension';
        else if (officeHigh && !abpmHigh) bpPhenotype = 'White-Coat Hypertension';
        else if (!officeHigh && abpmHigh) bpPhenotype = 'Masked Hypertension';
        else bpPhenotype = 'Normotension';
      }

      return await this.prisma.abpmReport.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          studyDate: dto.studyDate ? new Date(dto.studyDate) : new Date(),
          duration: dto.duration || '24h',
          deviceModel: dto.deviceModel || null, deviceSerialNo: dto.deviceSerialNo || null,
          totalReadings: dto.totalReadings ? Number(dto.totalReadings) : null,
          validReadings: dto.validReadings ? Number(dto.validReadings) : null,
          // Office BP
          officeSbp: officeSbp, officeDbp: dto.officeDbp ? Number(dto.officeDbp) : null,
          // 24h averages
          avg24hSbp: avgSbp24, avg24hDbp: dto.avg24hDbp ? Number(dto.avg24hDbp) : null,
          avg24hHr: dto.avg24hHr ? Number(dto.avg24hHr) : null,
          // Daytime (ESH threshold: >=135/85)
          daytimeAvgSbp: daySbp, daytimeAvgDbp: dto.daytimeAvgDbp ? Number(dto.daytimeAvgDbp) : null,
          daytimeAvgHr: dto.daytimeAvgHr ? Number(dto.daytimeAvgHr) : null,
          // Nighttime (ESH threshold: >=120/70)
          nighttimeAvgSbp: nightSbp, nighttimeAvgDbp: dto.nighttimeAvgDbp ? Number(dto.nighttimeAvgDbp) : null,
          nighttimeAvgHr: dto.nighttimeAvgHr ? Number(dto.nighttimeAvgHr) : null,
          // Dipping
          dippingPct: dippingPct, dippingStatus: dippingStatus,
          // BP Load (% readings above threshold)
          daytimeSbpLoad: dto.daytimeSbpLoad ? Number(dto.daytimeSbpLoad) : null,
          daytimeDbpLoad: dto.daytimeDbpLoad ? Number(dto.daytimeDbpLoad) : null,
          nighttimeSbpLoad: dto.nighttimeSbpLoad ? Number(dto.nighttimeSbpLoad) : null,
          nighttimeDbpLoad: dto.nighttimeDbpLoad ? Number(dto.nighttimeDbpLoad) : null,
          // Morning surge
          morningSurgeSbp: dto.morningSurgeSbp ? Number(dto.morningSurgeSbp) : null,
          // Peak values
          maxSbp: dto.maxSbp ? Number(dto.maxSbp) : null, maxDbp: dto.maxDbp ? Number(dto.maxDbp) : null,
          minSbp: dto.minSbp ? Number(dto.minSbp) : null, minDbp: dto.minDbp ? Number(dto.minDbp) : null,
          // Classification
          bpPhenotype: bpPhenotype,
          nocturnalHypertension: nightSbp ? nightSbp >= 120 : null,
          // Report
          interpretation: dto.interpretation || null, recommendation: dto.recommendation || null,
          referringDoctor: dto.referringDoctor || null, reportedBy: dto.reportedBy || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.abpmReport.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'duration', 'deviceModel', 'deviceSerialNo',
        'dippingStatus', 'bpPhenotype', 'nocturnalHypertension', 'interpretation',
        'recommendation', 'referringDoctor', 'reportedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'totalReadings', 'validReadings', 'officeSbp', 'officeDbp',
        'avg24hSbp', 'avg24hDbp', 'avg24hHr', 'daytimeAvgSbp', 'daytimeAvgDbp', 'daytimeAvgHr',
        'nighttimeAvgSbp', 'nighttimeAvgDbp', 'nighttimeAvgHr', 'dippingPct',
        'daytimeSbpLoad', 'daytimeDbpLoad', 'nighttimeSbpLoad', 'nighttimeDbpLoad',
        'morningSurgeSbp', 'maxSbp', 'maxDbp', 'minSbp', 'minDbp'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.studyDate) updateData.studyDate = new Date(dto.studyDate);
      return await this.prisma.abpmReport.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byDipping, byPhenotype] = await Promise.all([
        this.prisma.abpmReport.count({ where: { tenantId } }),
        this.prisma.abpmReport.groupBy({ by: ['dippingStatus'], where: { tenantId }, _count: true }),
        this.prisma.abpmReport.groupBy({ by: ['bpPhenotype'], where: { tenantId }, _count: true }),
      ]);
      return {
        total,
        byDipping: byDipping.filter(d => d.dippingStatus).map(d => ({ status: d.dippingStatus, count: d._count })),
        byPhenotype: byPhenotype.filter(p => p.bpPhenotype).map(p => ({ phenotype: p.bpPhenotype, count: p._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byDipping: [], byPhenotype: [] }; }
  }
}
