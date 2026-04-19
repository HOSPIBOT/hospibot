import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class IhcService {
  private readonly logger = new Logger(IhcService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { caseNumber: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.ihcWorkflow.findMany({ where, orderBy: { requestDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.ihcWorkflow.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.ihcWorkflow.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.caseNumber) throw new BadRequestException('Case number is required');
      if (!dto.antibodyPanel) throw new BadRequestException('Antibody panel is required');
      return await this.prisma.ihcWorkflow.create({
        data: {
          tenantId, caseNumber: dto.caseNumber, patientId: dto.patientId || null,
          patientName: dto.patientName || null, specimenType: dto.specimenType || null,
          specimenSite: dto.specimenSite || null, blockId: dto.blockId || null,
          requestDate: dto.requestDate ? new Date(dto.requestDate) : new Date(),
          requestedBy: dto.requestedBy || null, indication: dto.indication || null,
          antibodyPanel: dto.antibodyPanel, antibodies: dto.antibodies || null,
          cloneInfo: dto.cloneInfo || null, dilutions: dto.dilutions || null,
          controlType: dto.controlType || null, controlResult: dto.controlResult || null,
          stainingDate: dto.stainingDate ? new Date(dto.stainingDate) : null,
          stainingMethod: dto.stainingMethod || 'automated',
          platformUsed: dto.platformUsed || null,
          results: dto.results || null,
          scoringMethod: dto.scoringMethod || null, scores: dto.scores || null,
          herScore: dto.herScore || null, ki67Percentage: dto.ki67Percentage ? Number(dto.ki67Percentage) : null,
          erStatus: dto.erStatus || null, prStatus: dto.prStatus || null,
          interpretation: dto.interpretation || null,
          pathologistName: dto.pathologistName || null, technicianName: dto.technicianName || null,
          tatHours: dto.tatHours ? Number(dto.tatHours) : null,
          notes: dto.notes || null, status: dto.status || 'requested',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.ihcWorkflow.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['caseNumber', 'patientName', 'specimenType', 'specimenSite', 'blockId',
        'requestedBy', 'indication', 'antibodyPanel', 'controlType', 'controlResult',
        'stainingMethod', 'platformUsed', 'scoringMethod', 'herScore',
        'erStatus', 'prStatus', 'interpretation', 'pathologistName', 'technicianName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.ki67Percentage !== undefined) updateData.ki67Percentage = Number(dto.ki67Percentage);
      if (dto.tatHours !== undefined) updateData.tatHours = Number(dto.tatHours);
      const dateFields = ['requestDate', 'stainingDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      const jsonFields = ['antibodies', 'cloneInfo', 'dilutions', 'results', 'scores'];
      for (const f of jsonFields) { if (dto[f]) updateData[f] = dto[f]; }
      return await this.prisma.ihcWorkflow.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byPanel, byStatus] = await Promise.all([
        this.prisma.ihcWorkflow.count({ where: { tenantId } }),
        this.prisma.ihcWorkflow.groupBy({ by: ['antibodyPanel'], where: { tenantId }, _count: true }),
        this.prisma.ihcWorkflow.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      ]);
      return { total, byPanel: byPanel.map(p => ({ panel: p.antibodyPanel, count: p._count })), byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byPanel: [], byStatus: [] }; }
  }
}
