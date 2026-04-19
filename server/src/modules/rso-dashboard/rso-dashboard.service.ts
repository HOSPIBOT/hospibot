import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// AERB Dose Limits per AE(RP) Rules 2004
// Occupational: 20 mSv/yr averaged over 5 consecutive years, max 30 mSv any single year
// Public: 1 mSv/yr
// Pregnant worker (after declaration): 1 mSv for remainder of pregnancy
// Investigation level: 6 mSv/quarter (per AERB investigation triggers)

@Injectable()
export class RsoDashboardService {
  private readonly logger = new Logger(RsoDashboardService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, recordType, status, search } = query;
      const where: any = { tenantId };
      if (recordType) where.recordType = recordType;
      if (status) where.status = status;
      if (search) { where.OR = [{ staffName: { contains: search, mode: 'insensitive' } }, { badgeId: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.rsoDashboard.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.rsoDashboard.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.rsoDashboard.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.recordType) throw new BadRequestException('Record type is required');

      // Auto-flag AERB investigation level breaches
      let investigationRequired = false;
      let aerbAlert = null;
      if (dto.recordType === 'dose-record' && dto.doseMsv) {
        const dose = Number(dto.doseMsv);
        if (dose > 6) { investigationRequired = true; aerbAlert = 'INVESTIGATION LEVEL EXCEEDED: Dose >6 mSv/quarter — mandatory AERB investigation per AE(RP) Rules 2004'; }
        else if (dose > 5) { aerbAlert = 'WARNING: Approaching quarterly investigation level (6 mSv)'; }
      }

      return await this.prisma.rsoDashboard.create({
        data: {
          tenantId, recordType: dto.recordType,
          // Staff details
          staffName: dto.staffName || null, staffId: dto.staffId || null,
          designation: dto.designation || null, department: dto.department || null,
          classifiedWorker: dto.classifiedWorker || false,
          // TLD Badge
          badgeId: dto.badgeId || null, badgeType: dto.badgeType || 'TLD',
          monitoringPeriod: dto.monitoringPeriod || null,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
          // Dose readings
          doseMsv: dto.doseMsv ? Number(dto.doseMsv) : null,
          doseHp10: dto.doseHp10 ? Number(dto.doseHp10) : null,
          doseHp007: dto.doseHp007 ? Number(dto.doseHp007) : null,
          cumulativeAnnualDoseMsv: dto.cumulativeAnnualDoseMsv ? Number(dto.cumulativeAnnualDoseMsv) : null,
          fiveYearAvgMsv: dto.fiveYearAvgMsv ? Number(dto.fiveYearAvgMsv) : null,
          // AERB flags
          investigationRequired: investigationRequired,
          aerbAlert: aerbAlert,
          // Area monitoring
          areaName: dto.areaName || null, areaType: dto.areaType || null,
          ambientDoseRate: dto.ambientDoseRate ? Number(dto.ambientDoseRate) : null,
          ambientDoseUnit: dto.ambientDoseUnit || 'uSv/hr',
          // Incident
          incidentDescription: dto.incidentDescription || null,
          incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : null,
          correctiveAction: dto.correctiveAction || null,
          reportedToAerb: dto.reportedToAerb || false,
          // RSO info
          rsoName: dto.rsoName || null, rsoLevel: dto.rsoLevel || null,
          rsoCertExpiry: dto.rsoCertExpiry ? new Date(dto.rsoCertExpiry) : null,
          // Equipment
          surveyMeterUsed: dto.surveyMeterUsed || null,
          calibrationDate: dto.calibrationDate ? new Date(dto.calibrationDate) : null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.rsoDashboard.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['recordType', 'staffName', 'staffId', 'designation', 'department',
        'classifiedWorker', 'badgeId', 'badgeType', 'monitoringPeriod', 'areaName', 'areaType',
        'ambientDoseUnit', 'incidentDescription', 'correctiveAction', 'reportedToAerb',
        'rsoName', 'rsoLevel', 'surveyMeterUsed', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['doseMsv', 'doseHp10', 'doseHp007', 'cumulativeAnnualDoseMsv',
        'fiveYearAvgMsv', 'ambientDoseRate'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['periodStart', 'periodEnd', 'incidentDate', 'rsoCertExpiry', 'calibrationDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.rsoDashboard.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, investigations, byType] = await Promise.all([
        this.prisma.rsoDashboard.count({ where: { tenantId } }),
        this.prisma.rsoDashboard.count({ where: { tenantId, investigationRequired: true } }),
        this.prisma.rsoDashboard.groupBy({ by: ['recordType'], where: { tenantId }, _count: true }),
      ]);
      return { total, investigationsRequired: investigations, byType: byType.map(t => ({ type: t.recordType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, investigationsRequired: 0, byType: [] }; }
  }
}
