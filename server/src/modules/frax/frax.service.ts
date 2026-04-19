import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FraxService {
  private readonly logger = new Logger(FraxService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.fraxAssessment.findMany({ where, orderBy: { scanDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.fraxAssessment.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.fraxAssessment.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      // Auto-classify WHO T-score categories
      const tScoreSpine = dto.tScoreSpine ? Number(dto.tScoreSpine) : null;
      const tScoreHip = dto.tScoreHip ? Number(dto.tScoreHip) : null;
      const lowestT = Math.min(...[tScoreSpine, tScoreHip].filter(v => v !== null) as number[]);
      let whoClassification = null;
      if (!isNaN(lowestT)) {
        if (lowestT >= -1.0) whoClassification = 'Normal';
        else if (lowestT >= -2.5) whoClassification = 'Osteopenia';
        else whoClassification = 'Osteoporosis';
      }

      return await this.prisma.fraxAssessment.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          patientHeight: dto.patientHeight ? Number(dto.patientHeight) : null,
          patientWeight: dto.patientWeight ? Number(dto.patientWeight) : null,
          scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
          scanSite: dto.scanSite || 'lumbar-spine-hip',
          // DEXA results
          bmdSpine: dto.bmdSpine ? Number(dto.bmdSpine) : null,
          tScoreSpine: tScoreSpine, zScoreSpine: dto.zScoreSpine ? Number(dto.zScoreSpine) : null,
          bmdHip: dto.bmdHip ? Number(dto.bmdHip) : null,
          tScoreHip: tScoreHip, zScoreHip: dto.zScoreHip ? Number(dto.zScoreHip) : null,
          bmdFemoralNeck: dto.bmdFemoralNeck ? Number(dto.bmdFemoralNeck) : null,
          tScoreFemoralNeck: dto.tScoreFemoralNeck ? Number(dto.tScoreFemoralNeck) : null,
          whoClassification: whoClassification,
          // FRAX risk factors
          previousFracture: dto.previousFracture || false,
          parentHipFracture: dto.parentHipFracture || false,
          currentSmoking: dto.currentSmoking || false,
          glucocorticoids: dto.glucocorticoids || false,
          rheumatoidArthritis: dto.rheumatoidArthritis || false,
          secondaryOsteoporosis: dto.secondaryOsteoporosis || false,
          alcoholUnits: dto.alcoholUnits ? Number(dto.alcoholUnits) : null,
          // FRAX scores
          fraxMajor: dto.fraxMajor ? Number(dto.fraxMajor) : null,
          fraxHip: dto.fraxHip ? Number(dto.fraxHip) : null,
          treatmentThreshold: dto.fraxMajor && Number(dto.fraxMajor) >= 20 ? true : dto.fraxHip && Number(dto.fraxHip) >= 3 ? true : false,
          // Body composition (if whole body scan)
          totalBodyFat: dto.totalBodyFat ? Number(dto.totalBodyFat) : null,
          leanMass: dto.leanMass ? Number(dto.leanMass) : null,
          fatPercentage: dto.fatPercentage ? Number(dto.fatPercentage) : null,
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          technicianName: dto.technicianName || null, reviewedBy: dto.reviewedBy || null,
          equipmentId: dto.equipmentId || null,
          pregnancyScreened: dto.pregnancyScreened || false,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.fraxAssessment.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'scanSite', 'whoClassification',
        'previousFracture', 'parentHipFracture', 'currentSmoking', 'glucocorticoids',
        'rheumatoidArthritis', 'secondaryOsteoporosis', 'pregnancyScreened',
        'interpretation', 'recommendation', 'technicianName', 'reviewedBy', 'equipmentId', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'patientHeight', 'patientWeight', 'bmdSpine', 'tScoreSpine', 'zScoreSpine',
        'bmdHip', 'tScoreHip', 'zScoreHip', 'bmdFemoralNeck', 'tScoreFemoralNeck',
        'alcoholUnits', 'fraxMajor', 'fraxHip', 'totalBodyFat', 'leanMass', 'fatPercentage'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.scanDate) updateData.scanDate = new Date(dto.scanDate);
      return await this.prisma.fraxAssessment.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byClass] = await Promise.all([
        this.prisma.fraxAssessment.count({ where: { tenantId } }),
        this.prisma.fraxAssessment.groupBy({ by: ['whoClassification'], where: { tenantId }, _count: true }),
      ]);
      return { total, byClassification: byClass.filter(c => c.whoClassification).map(c => ({ classification: c.whoClassification, count: c._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byClassification: [] }; }
  }
}
