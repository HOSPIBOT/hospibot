import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GcMsService {
  private readonly logger = new Logger(GcMsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, testType, status, search } = query;
      const where: any = { tenantId };
      if (testType) where.testType = testType;
      if (status) where.status = status;
      if (search) { where.OR = [{ caseNumber: { contains: search, mode: 'insensitive' } }, { subjectName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.gcMsAnalysis.findMany({ where, orderBy: { analysisDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.gcMsAnalysis.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.gcMsAnalysis.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.caseNumber) throw new BadRequestException('Case number is required');
      if (!dto.testType) throw new BadRequestException('Test type is required');
      if (!dto.instrumentMethod) throw new BadRequestException('Instrument method (GC-MS/LC-MS) is required per ISO 17025');

      return await this.prisma.gcMsAnalysis.create({
        data: {
          tenantId, caseNumber: dto.caseNumber, custodyChainId: dto.custodyChainId || null,
          subjectName: dto.subjectName || null, subjectId: dto.subjectId || null,
          testType: dto.testType,
          specimenType: dto.specimenType || null, specimenId: dto.specimenId || null,
          screeningResult: dto.screeningResult || null, screeningMethod: dto.screeningMethod || null,
          screeningDate: dto.screeningDate ? new Date(dto.screeningDate) : null,
          confirmRequired: dto.confirmRequired || false,
          instrumentMethod: dto.instrumentMethod,
          instrumentId: dto.instrumentId || null, columnType: dto.columnType || null,
          analysisDate: dto.analysisDate ? new Date(dto.analysisDate) : new Date(),
          analystName: dto.analystName || null, analystId: dto.analystId || null,
          results: dto.results || null,
          cutoffValues: dto.cutoffValues || null,
          overallResult: dto.overallResult || null,
          quantitativeResults: dto.quantitativeResults || null,
          retentionTimes: dto.retentionTimes || null,
          ionRatios: dto.ionRatios || null,
          qcPassed: dto.qcPassed || false,
          internalStandard: dto.internalStandard || null,
          batchId: dto.batchId || null,
          reviewedBy: dto.reviewedBy || null, reviewedDate: dto.reviewedDate ? new Date(dto.reviewedDate) : null,
          reportNumber: dto.reportNumber || null,
          ndpsRelevant: dto.ndpsRelevant || false,
          notes: dto.notes || null, status: dto.status || 'in-progress',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.gcMsAnalysis.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      if (existing.status === 'reported') throw new BadRequestException('Cannot modify a reported GC-MS analysis');
      const updateData: any = {};
      const fields = ['caseNumber', 'subjectName', 'subjectId', 'testType', 'specimenType', 'specimenId',
        'screeningResult', 'screeningMethod', 'confirmRequired', 'instrumentMethod', 'instrumentId',
        'columnType', 'analystName', 'analystId', 'overallResult', 'qcPassed', 'internalStandard',
        'batchId', 'reviewedBy', 'reportNumber', 'ndpsRelevant', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const dateFields = ['screeningDate', 'analysisDate', 'reviewedDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      const jsonFields = ['results', 'cutoffValues', 'quantitativeResults', 'retentionTimes', 'ionRatios'];
      for (const f of jsonFields) { if (dto[f]) updateData[f] = dto[f]; }
      return await this.prisma.gcMsAnalysis.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, positive, byType] = await Promise.all([
        this.prisma.gcMsAnalysis.count({ where: { tenantId } }),
        this.prisma.gcMsAnalysis.count({ where: { tenantId, overallResult: 'positive' } }),
        this.prisma.gcMsAnalysis.groupBy({ by: ['testType'], where: { tenantId }, _count: true }),
      ]);
      return { total, positive, byType: byType.map(t => ({ type: t.testType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, positive: 0, byType: [] }; }
  }
}
