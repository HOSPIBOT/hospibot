import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CasaService {
  private readonly logger = new Logger(CasaService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.casaAnalysis.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.casaAnalysis.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.casaAnalysis.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      // WHO 6th edition reference values auto-check
      const concentration = dto.concentration ? Number(dto.concentration) : null;
      const totalMotility = dto.totalMotility ? Number(dto.totalMotility) : null;
      const morphology = dto.normalMorphology ? Number(dto.normalMorphology) : null;
      let whoAssessment = 'Normal';
      if ((concentration !== null && concentration < 16) || (totalMotility !== null && totalMotility < 42) || (morphology !== null && morphology < 4)) {
        whoAssessment = 'Abnormal';
      }
      return await this.prisma.casaAnalysis.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          partnerName: dto.partnerName || null,
          testDate: dto.testDate ? new Date(dto.testDate) : new Date(),
          abstinenceDays: dto.abstinenceDays ? Number(dto.abstinenceDays) : null,
          collectionMethod: dto.collectionMethod || 'masturbation',
          collectionTime: dto.collectionTime || null, analysisTime: dto.analysisTime || null,
          liquefactionTime: dto.liquefactionTime ? Number(dto.liquefactionTime) : null,
          volume: dto.volume ? Number(dto.volume) : null,
          ph: dto.ph ? Number(dto.ph) : null,
          appearance: dto.appearance || null, viscosity: dto.viscosity || null,
          concentration: concentration,
          totalCount: dto.totalCount ? Number(dto.totalCount) : null,
          totalMotility: totalMotility,
          progressiveMotility: dto.progressiveMotility ? Number(dto.progressiveMotility) : null,
          nonProgressiveMotility: dto.nonProgressiveMotility ? Number(dto.nonProgressiveMotility) : null,
          immotile: dto.immotile ? Number(dto.immotile) : null,
          rapidProgressive: dto.rapidProgressive ? Number(dto.rapidProgressive) : null,
          slowProgressive: dto.slowProgressive ? Number(dto.slowProgressive) : null,
          vcl: dto.vcl ? Number(dto.vcl) : null,
          vsl: dto.vsl ? Number(dto.vsl) : null,
          vap: dto.vap ? Number(dto.vap) : null,
          normalMorphology: morphology,
          headDefects: dto.headDefects ? Number(dto.headDefects) : null,
          midpieceDefects: dto.midpieceDefects ? Number(dto.midpieceDefects) : null,
          tailDefects: dto.tailDefects ? Number(dto.tailDefects) : null,
          tzi: dto.tzi ? Number(dto.tzi) : null,
          vitality: dto.vitality ? Number(dto.vitality) : null,
          roundCells: dto.roundCells ? Number(dto.roundCells) : null,
          wbc: dto.wbc ? Number(dto.wbc) : null,
          agglutination: dto.agglutination || null,
          whoAssessment: whoAssessment,
          casaInstrument: dto.casaInstrument || null,
          andrologist: dto.andrologist || null, reviewedBy: dto.reviewedBy || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.casaAnalysis.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'partnerName', 'collectionMethod', 'collectionTime', 'analysisTime',
        'appearance', 'viscosity', 'agglutination', 'whoAssessment', 'casaInstrument',
        'andrologist', 'reviewedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['abstinenceDays', 'liquefactionTime', 'volume', 'ph', 'concentration', 'totalCount',
        'totalMotility', 'progressiveMotility', 'nonProgressiveMotility', 'immotile',
        'rapidProgressive', 'slowProgressive', 'vcl', 'vsl', 'vap', 'normalMorphology',
        'headDefects', 'midpieceDefects', 'tailDefects', 'tzi', 'vitality', 'roundCells', 'wbc'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      return await this.prisma.casaAnalysis.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byAssessment] = await Promise.all([
        this.prisma.casaAnalysis.count({ where: { tenantId } }),
        this.prisma.casaAnalysis.groupBy({ by: ['whoAssessment'], where: { tenantId }, _count: true }),
      ]);
      return { total, byAssessment: byAssessment.map(a => ({ assessment: a.whoAssessment, count: a._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byAssessment: [] }; }
  }
}
