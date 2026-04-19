import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FrozenSectionService {
  private readonly logger = new Logger(FrozenSectionService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { caseNumber: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.frozenSection.findMany({ where, orderBy: { receivedAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.frozenSection.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.frozenSection.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.caseNumber) throw new BadRequestException('Case number is required');
      if (!dto.surgeonName) throw new BadRequestException('Surgeon name is required');
      // Auto-calculate TAT
      let tatMinutes = null;
      if (dto.receivedAt && dto.reportedAt) {
        tatMinutes = Math.round((new Date(dto.reportedAt).getTime() - new Date(dto.receivedAt).getTime()) / 60000);
      }
      return await this.prisma.frozenSection.create({
        data: {
          tenantId, caseNumber: dto.caseNumber, patientId: dto.patientId || null,
          patientName: dto.patientName || null, surgeonName: dto.surgeonName,
          operatingRoom: dto.operatingRoom || null,
          specimenType: dto.specimenType || null, specimenSite: dto.specimenSite || null,
          clinicalQuestion: dto.clinicalQuestion || null,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          grossDescription: dto.grossDescription || null,
          sectionsCount: dto.sectionsCount ? Number(dto.sectionsCount) : null,
          frozenDiagnosis: dto.frozenDiagnosis || null,
          communicatedTo: dto.communicatedTo || null,
          communicatedAt: dto.communicatedAt ? new Date(dto.communicatedAt) : null,
          communicationMethod: dto.communicationMethod || 'phone',
          reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : null,
          tatMinutes: tatMinutes,
          permanentDiagnosis: dto.permanentDiagnosis || null,
          concordant: dto.concordant || null,
          discordanceReason: dto.discordanceReason || null,
          pathologistName: dto.pathologistName || null, technicianName: dto.technicianName || null,
          notes: dto.notes || null, status: dto.status || 'received',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.frozenSection.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['caseNumber', 'patientName', 'surgeonName', 'operatingRoom', 'specimenType',
        'specimenSite', 'clinicalQuestion', 'grossDescription', 'frozenDiagnosis',
        'communicatedTo', 'communicationMethod', 'permanentDiagnosis', 'concordant',
        'discordanceReason', 'pathologistName', 'technicianName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.sectionsCount !== undefined) updateData.sectionsCount = Number(dto.sectionsCount);
      const dateFields = ['receivedAt', 'communicatedAt', 'reportedAt'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      // Recalculate TAT
      const recAt = dto.receivedAt ? new Date(dto.receivedAt) : existing.receivedAt;
      const repAt = dto.reportedAt ? new Date(dto.reportedAt) : existing.reportedAt;
      if (recAt && repAt) updateData.tatMinutes = Math.round((repAt.getTime() - recAt.getTime()) / 60000);
      return await this.prisma.frozenSection.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const all = await this.prisma.frozenSection.findMany({ where: { tenantId }, select: { tatMinutes: true, concordant: true } });
      const total = all.length;
      const withTat = all.filter(r => r.tatMinutes != null);
      const avgTat = withTat.length > 0 ? Math.round(withTat.reduce((s, r) => s + (r.tatMinutes || 0), 0) / withTat.length) : 0;
      const concordant = all.filter(r => r.concordant === true).length;
      const discordant = all.filter(r => r.concordant === false).length;
      return { total, avgTatMinutes: avgTat, concordant, discordant, concordanceRate: total > 0 ? Math.round((concordant / (concordant + discordant || 1)) * 100) : 0 };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, avgTatMinutes: 0, concordant: 0, discordant: 0, concordanceRate: 0 }; }
  }
}
