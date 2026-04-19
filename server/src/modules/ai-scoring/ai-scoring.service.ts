import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AiScoringService {
  private readonly logger = new Logger(AiScoringService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, riskLevel, cancerType, status, search } = query;
      const where: any = { tenantId };
      if (riskLevel) where.riskLevel = riskLevel;
      if (cancerType) where.cancerType = cancerType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.aiRiskScore.findMany({ where, orderBy: { assessmentDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.aiRiskScore.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.aiRiskScore.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.cancerType) throw new BadRequestException('Cancer type is required');
      // Auto-classify risk level from score
      const riskScore = dto.riskScore ? Number(dto.riskScore) : null;
      let riskLevel = null;
      if (riskScore !== null) {
        if (riskScore < 20) riskLevel = 'Low';
        else if (riskScore < 50) riskLevel = 'Moderate';
        else if (riskScore < 80) riskLevel = 'High';
        else riskLevel = 'Very High';
      }
      return await this.prisma.aiRiskScore.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : new Date(),
          cancerType: dto.cancerType, screeningTool: dto.screeningTool || null,
          riskScore: riskScore, riskLevel: riskLevel,
          inputMarkers: dto.inputMarkers || null,
          inputImaging: dto.inputImaging || null,
          inputFamilyHistory: dto.inputFamilyHistory || null,
          inputLifestyle: dto.inputLifestyle || null,
          inputGenomics: dto.inputGenomics || null,
          modelVersion: dto.modelVersion || null, modelName: dto.modelName || null,
          confidenceInterval: dto.confidenceInterval || null,
          recommendation: dto.recommendation || null,
          followUpInterval: dto.followUpInterval || null,
          referralNeeded: dto.referralNeeded || false,
          referralTo: dto.referralTo || null,
          clinicianReview: dto.clinicianReview || null,
          clinicianOverride: dto.clinicianOverride || false,
          overrideReason: dto.overrideReason || null,
          disclaimer: 'AI-generated risk scores are decision-support tools only. Clinical judgment must guide all patient management decisions.',
          notes: dto.notes || null, status: dto.status || 'generated',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.aiRiskScore.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'cancerType', 'screeningTool', 'riskLevel',
        'modelVersion', 'modelName', 'confidenceInterval', 'recommendation', 'followUpInterval',
        'referralNeeded', 'referralTo', 'clinicianReview', 'clinicianOverride', 'overrideReason',
        'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.patientAge !== undefined) updateData.patientAge = Number(dto.patientAge);
      if (dto.riskScore !== undefined) updateData.riskScore = Number(dto.riskScore);
      if (dto.assessmentDate) updateData.assessmentDate = new Date(dto.assessmentDate);
      const jsonFields = ['inputMarkers', 'inputImaging', 'inputFamilyHistory', 'inputLifestyle', 'inputGenomics'];
      for (const f of jsonFields) { if (dto[f]) updateData[f] = dto[f]; }
      return await this.prisma.aiRiskScore.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byRisk, byCancer] = await Promise.all([
        this.prisma.aiRiskScore.count({ where: { tenantId } }),
        this.prisma.aiRiskScore.groupBy({ by: ['riskLevel'], where: { tenantId }, _count: true }),
        this.prisma.aiRiskScore.groupBy({ by: ['cancerType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byRisk: byRisk.filter(r => r.riskLevel).map(r => ({ risk: r.riskLevel, count: r._count })), byCancer: byCancer.map(c => ({ cancer: c.cancerType, count: c._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byRisk: [], byCancer: [] }; }
  }
}
