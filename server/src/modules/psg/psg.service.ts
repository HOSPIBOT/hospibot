import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PsgService {
  private readonly logger = new Logger(PsgService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, severity, status, search } = query;
      const where: any = { tenantId };
      if (severity) where.osaSeverity = severity;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.psgStudy.findMany({ where, orderBy: { studyDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.psgStudy.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.psgStudy.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      // Auto-classify OSA severity per AASM
      const ahi = dto.ahi ? Number(dto.ahi) : null;
      let osaSeverity = null;
      if (ahi !== null) {
        if (ahi < 5) osaSeverity = 'Normal';
        else if (ahi < 15) osaSeverity = 'Mild';
        else if (ahi < 30) osaSeverity = 'Moderate';
        else osaSeverity = 'Severe';
      }
      return await this.prisma.psgStudy.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientBmi: dto.patientBmi ? Number(dto.patientBmi) : null,
          epworthScore: dto.epworthScore ? Number(dto.epworthScore) : null,
          studyDate: dto.studyDate ? new Date(dto.studyDate) : new Date(),
          studyType: dto.studyType || 'full-psg',
          lightsOff: dto.lightsOff || null, lightsOn: dto.lightsOn || null,
          totalRecordTime: dto.totalRecordTime ? Number(dto.totalRecordTime) : null,
          totalSleepTime: dto.totalSleepTime ? Number(dto.totalSleepTime) : null,
          sleepEfficiency: dto.sleepEfficiency ? Number(dto.sleepEfficiency) : null,
          sleepLatency: dto.sleepLatency ? Number(dto.sleepLatency) : null,
          remLatency: dto.remLatency ? Number(dto.remLatency) : null,
          stageN1Pct: dto.stageN1Pct ? Number(dto.stageN1Pct) : null,
          stageN2Pct: dto.stageN2Pct ? Number(dto.stageN2Pct) : null,
          stageN3Pct: dto.stageN3Pct ? Number(dto.stageN3Pct) : null,
          stageRemPct: dto.stageRemPct ? Number(dto.stageRemPct) : null,
          ahi: ahi, obstructiveApneas: dto.obstructiveApneas ? Number(dto.obstructiveApneas) : null,
          centralApneas: dto.centralApneas ? Number(dto.centralApneas) : null,
          mixedApneas: dto.mixedApneas ? Number(dto.mixedApneas) : null,
          hypopneas: dto.hypopneas ? Number(dto.hypopneas) : null,
          osaSeverity: osaSeverity,
          supineAhi: dto.supineAhi ? Number(dto.supineAhi) : null,
          remAhi: dto.remAhi ? Number(dto.remAhi) : null,
          lowestSpo2: dto.lowestSpo2 ? Number(dto.lowestSpo2) : null,
          meanSpo2: dto.meanSpo2 ? Number(dto.meanSpo2) : null,
          odi: dto.odi ? Number(dto.odi) : null,
          t90: dto.t90 ? Number(dto.t90) : null,
          plmIndex: dto.plmIndex ? Number(dto.plmIndex) : null,
          arousalIndex: dto.arousalIndex ? Number(dto.arousalIndex) : null,
          snoring: dto.snoring || false, bruxism: dto.bruxism || false,
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          sleepPhysician: dto.sleepPhysician || null, technicianName: dto.technicianName || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.psgStudy.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'studyType', 'lightsOff', 'lightsOn', 'osaSeverity',
        'snoring', 'bruxism', 'interpretation', 'recommendation',
        'sleepPhysician', 'technicianName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'patientBmi', 'epworthScore', 'totalRecordTime', 'totalSleepTime',
        'sleepEfficiency', 'sleepLatency', 'remLatency', 'stageN1Pct', 'stageN2Pct', 'stageN3Pct',
        'stageRemPct', 'ahi', 'obstructiveApneas', 'centralApneas', 'mixedApneas', 'hypopneas',
        'supineAhi', 'remAhi', 'lowestSpo2', 'meanSpo2', 'odi', 't90', 'plmIndex', 'arousalIndex'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.studyDate) updateData.studyDate = new Date(dto.studyDate);
      // Recalculate severity
      if (dto.ahi !== undefined) {
        const a = Number(dto.ahi);
        updateData.osaSeverity = a < 5 ? 'Normal' : a < 15 ? 'Mild' : a < 30 ? 'Moderate' : 'Severe';
      }
      return await this.prisma.psgStudy.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, bySeverity] = await Promise.all([
        this.prisma.psgStudy.count({ where: { tenantId } }),
        this.prisma.psgStudy.groupBy({ by: ['osaSeverity'], where: { tenantId }, _count: true }),
      ]);
      return { total, bySeverity: bySeverity.filter(s => s.osaSeverity).map(s => ({ severity: s.osaSeverity, count: s._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, bySeverity: [] }; }
  }
}
