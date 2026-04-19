import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Industry standard TATs for teleradiology:
// STAT/Emergency: 30-45 minutes
// Priority: 2-3 hours
// Routine: 6-8 hours

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, breached, priority, clientId, search } = query;
      const where: any = { tenantId };
      if (breached === 'true') where.breached = true;
      if (breached === 'false') where.breached = false;
      if (priority) where.priority = priority;
      if (clientId) where.clientId = clientId;
      if (search) { where.OR = [{ studyAccession: { contains: search, mode: 'insensitive' } }, { patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.slaAlert.findMany({ where, orderBy: { receivedAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.slaAlert.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.slaAlert.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.studyAccession) throw new BadRequestException('Study accession number required');
      const targetMin = dto.targetMinutes ? Number(dto.targetMinutes) : (dto.priority === 'stat' ? 30 : dto.priority === 'priority' ? 180 : 480);
      const receivedAt = dto.receivedAt ? new Date(dto.receivedAt) : new Date();
      const reportedAt = dto.reportedAt ? new Date(dto.reportedAt) : null;
      let actualMinutes = null;
      let breached = false;
      if (reportedAt) {
        actualMinutes = Math.round((reportedAt.getTime() - receivedAt.getTime()) / 60000);
        breached = actualMinutes > targetMin;
      }
      return await this.prisma.slaAlert.create({
        data: {
          tenantId, clientId: dto.clientId || null, clientName: dto.clientName || null,
          studyAccession: dto.studyAccession, patientName: dto.patientName || null,
          modality: dto.modality || null, bodyPart: dto.bodyPart || null,
          priority: dto.priority || 'routine',
          targetMinutes: targetMin,
          receivedAt: receivedAt, assignedAt: dto.assignedAt ? new Date(dto.assignedAt) : null,
          reportedAt: reportedAt, actualMinutes: actualMinutes,
          breached: breached,
          breachReason: dto.breachReason || null,
          escalatedTo: dto.escalatedTo || null,
          radiologistName: dto.radiologistName || null,
          notes: dto.notes || null, status: dto.status || 'tracking',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.slaAlert.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['clientId', 'clientName', 'studyAccession', 'patientName', 'modality',
        'bodyPart', 'priority', 'breachReason', 'escalatedTo', 'radiologistName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.targetMinutes) updateData.targetMinutes = Number(dto.targetMinutes);
      if (dto.reportedAt) {
        updateData.reportedAt = new Date(dto.reportedAt);
        const received = existing.receivedAt;
        updateData.actualMinutes = Math.round((updateData.reportedAt.getTime() - received.getTime()) / 60000);
        updateData.breached = updateData.actualMinutes > (existing.targetMinutes || 480);
      }
      if (dto.assignedAt) updateData.assignedAt = new Date(dto.assignedAt);
      return await this.prisma.slaAlert.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, breaches, byPriority] = await Promise.all([
        this.prisma.slaAlert.count({ where: { tenantId } }),
        this.prisma.slaAlert.count({ where: { tenantId, breached: true } }),
        this.prisma.slaAlert.groupBy({ by: ['priority'], where: { tenantId }, _count: true }),
      ]);
      return { total, breaches, complianceRate: total > 0 ? Math.round(((total - breaches) / total) * 100) : 100, byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, breaches: 0, complianceRate: 100, byPriority: [] }; }
  }
}
