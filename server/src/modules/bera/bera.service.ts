import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BeraService {
  private readonly logger = new Logger(BeraService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, testType, status, search } = query;
      const where: any = { tenantId };
      if (testType) where.testType = testType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.beraTest.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.beraTest.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.beraTest.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      return await this.prisma.beraTest.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge || null, isNewborn: dto.isNewborn || false,
          gestationalAge: dto.gestationalAge ? Number(dto.gestationalAge) : null,
          birthWeight: dto.birthWeight ? Number(dto.birthWeight) : null,
          testDate: dto.testDate ? new Date(dto.testDate) : new Date(),
          testType: dto.testType || 'abr',
          indication: dto.indication || null, riskFactors: dto.riskFactors || null,
          stimulusType: dto.stimulusType || 'click', stimulusRate: dto.stimulusRate || null,
          stimulusPolarity: dto.stimulusPolarity || null,
          rightThreshold: dto.rightThreshold ? Number(dto.rightThreshold) : null,
          leftThreshold: dto.leftThreshold ? Number(dto.leftThreshold) : null,
          rightWaveV: dto.rightWaveV ? Number(dto.rightWaveV) : null,
          leftWaveV: dto.leftWaveV ? Number(dto.leftWaveV) : null,
          rightWaveI: dto.rightWaveI ? Number(dto.rightWaveI) : null,
          leftWaveI: dto.leftWaveI ? Number(dto.leftWaveI) : null,
          rightIPL: dto.rightIPL ? Number(dto.rightIPL) : null,
          leftIPL: dto.leftIPL ? Number(dto.leftIPL) : null,
          rightResult: dto.rightResult || null, leftResult: dto.leftResult || null,
          oaeRightResult: dto.oaeRightResult || null, oaeLeftResult: dto.oaeLeftResult || null,
          screeningResult: dto.screeningResult || null,
          referForDiagnostic: dto.referForDiagnostic || false,
          interpretation: dto.interpretation || null,
          audiologistName: dto.audiologistName || null, reviewedBy: dto.reviewedBy || null,
          equipmentId: dto.equipmentId || null, notes: dto.notes || null,
          status: dto.status || 'draft', createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.beraTest.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientAge', 'isNewborn', 'testType', 'indication', 'riskFactors',
        'stimulusType', 'stimulusRate', 'stimulusPolarity', 'rightResult', 'leftResult',
        'oaeRightResult', 'oaeLeftResult', 'screeningResult', 'referForDiagnostic',
        'interpretation', 'audiologistName', 'reviewedBy', 'equipmentId', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['gestationalAge', 'birthWeight', 'rightThreshold', 'leftThreshold',
        'rightWaveV', 'leftWaveV', 'rightWaveI', 'leftWaveI', 'rightIPL', 'leftIPL'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      return await this.prisma.beraTest.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byResult, referred] = await Promise.all([
        this.prisma.beraTest.count({ where: { tenantId } }),
        this.prisma.beraTest.groupBy({ by: ['screeningResult'], where: { tenantId }, _count: true }),
        this.prisma.beraTest.count({ where: { tenantId, referForDiagnostic: true } }),
      ]);
      return { total, referred, byResult: byResult.filter(r => r.screeningResult).map(r => ({ result: r.screeningResult, count: r._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, referred: 0, byResult: [] }; }
  }
}
