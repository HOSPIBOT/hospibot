import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReadingWorklistService {
  private readonly logger = new Logger(ReadingWorklistService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, priority, modality, assignedTo, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (modality) where.modality = modality;
      if (assignedTo) where.assignedTo = assignedTo;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { accessionNumber: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.readingWorklist.findMany({ where, orderBy: [{ priority: 'asc' }, { receivedAt: 'asc' }], skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.readingWorklist.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.readingWorklist.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.accessionNumber) throw new BadRequestException('Accession number required');
      const priorityOrder: Record<string, number> = { stat: 1, urgent: 2, priority: 3, routine: 4 };
      return await this.prisma.readingWorklist.create({
        data: {
          tenantId, clientCenterId: dto.clientCenterId || null, clientName: dto.clientName || null,
          accessionNumber: dto.accessionNumber, patientName: dto.patientName || null,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          modality: dto.modality || null, bodyPart: dto.bodyPart || null,
          studyDescription: dto.studyDescription || null,
          seriesCount: dto.seriesCount ? Number(dto.seriesCount) : null,
          imageCount: dto.imageCount ? Number(dto.imageCount) : null,
          priority: dto.priority || 'routine',
          priorityOrder: priorityOrder[dto.priority || 'routine'] || 4,
          clinicalHistory: dto.clinicalHistory || null,
          referringDoctor: dto.referringDoctor || null,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          assignedTo: dto.assignedTo || null, assignedAt: dto.assignedAt ? new Date(dto.assignedAt) : null,
          reportStartedAt: dto.reportStartedAt ? new Date(dto.reportStartedAt) : null,
          reportCompletedAt: dto.reportCompletedAt ? new Date(dto.reportCompletedAt) : null,
          reportDeliveredAt: dto.reportDeliveredAt ? new Date(dto.reportDeliveredAt) : null,
          slaDeadline: dto.slaDeadline ? new Date(dto.slaDeadline) : null,
          criticalFinding: dto.criticalFinding || false,
          criticalFindingComm: dto.criticalFindingComm || null,
          reportText: dto.reportText || null, addendum: dto.addendum || null,
          notes: dto.notes || null, status: dto.status || 'pending',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.readingWorklist.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['clientCenterId', 'clientName', 'accessionNumber', 'patientName', 'patientGender',
        'modality', 'bodyPart', 'studyDescription', 'priority', 'clinicalHistory', 'referringDoctor',
        'assignedTo', 'criticalFinding', 'criticalFindingComm', 'reportText', 'addendum', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'seriesCount', 'imageCount', 'priorityOrder'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['receivedAt', 'assignedAt', 'reportStartedAt', 'reportCompletedAt', 'reportDeliveredAt', 'slaDeadline'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.readingWorklist.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, pending, inProgress, completed, critical] = await Promise.all([
        this.prisma.readingWorklist.count({ where: { tenantId } }),
        this.prisma.readingWorklist.count({ where: { tenantId, status: 'pending' } }),
        this.prisma.readingWorklist.count({ where: { tenantId, status: 'in-progress' } }),
        this.prisma.readingWorklist.count({ where: { tenantId, status: 'completed' } }),
        this.prisma.readingWorklist.count({ where: { tenantId, criticalFinding: true } }),
      ]);
      return { total, pending, inProgress, completed, criticalFindings: critical };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, pending: 0, inProgress: 0, completed: 0, criticalFindings: 0 }; }
  }
}
