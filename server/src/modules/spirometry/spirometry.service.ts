import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ATS/ERS quality grades for spirometry
const QUALITY_GRADES = ['A', 'B', 'C', 'D', 'F'];
// GOLD staging per GOLD 2024 guidelines
const GOLD_STAGES: Record<string, { label: string; fev1Pct: string }> = {
  'GOLD-1': { label: 'Mild', fev1Pct: '≥80%' },
  'GOLD-2': { label: 'Moderate', fev1Pct: '50–79%' },
  'GOLD-3': { label: 'Severe', fev1Pct: '30–49%' },
  'GOLD-4': { label: 'Very Severe', fev1Pct: '<30%' },
};

@Injectable()
export class SpirometryService {
  private readonly logger = new Logger(SpirometryService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { patientName: { contains: search, mode: 'insensitive' } },
          { patientUhid: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.spirometryTest.findMany({
          where, orderBy: { testDate: 'desc' },
          skip: (page - 1) * limit, take: Number(limit),
        }),
        this.prisma.spirometryTest.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.spirometryTest.findFirst({ where: { id, tenantId } });
    } catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.testDate) throw new BadRequestException('Test date is required');

      // Auto-calculate derived values
      const fev1Fvc = dto.fev1 && dto.fvc ? Math.round((dto.fev1 / dto.fvc) * 100 * 10) / 10 : null;
      const fev1PctPredicted = dto.fev1 && dto.fev1Predicted ? Math.round((dto.fev1 / dto.fev1Predicted) * 100) : null;
      const fvcPctPredicted = dto.fvc && dto.fvcPredicted ? Math.round((dto.fvc / dto.fvcPredicted) * 100) : null;

      // Auto GOLD staging
      let goldStage = null;
      if (fev1Fvc && fev1Fvc < 70 && fev1PctPredicted) {
        if (fev1PctPredicted >= 80) goldStage = 'GOLD-1';
        else if (fev1PctPredicted >= 50) goldStage = 'GOLD-2';
        else if (fev1PctPredicted >= 30) goldStage = 'GOLD-3';
        else goldStage = 'GOLD-4';
      }

      return await this.prisma.spirometryTest.create({
        data: {
          tenantId,
          patientId: dto.patientId || null,
          patientName: dto.patientName,
          patientUhid: dto.patientUhid || null,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          patientHeight: dto.patientHeight ? Number(dto.patientHeight) : null,
          patientWeight: dto.patientWeight ? Number(dto.patientWeight) : null,
          testDate: new Date(dto.testDate),
          indication: dto.indication || null,
          preBronchodilator: dto.preBronchodilator !== false,
          postBronchodilator: dto.postBronchodilator || false,
          bronchodilatorUsed: dto.bronchodilatorUsed || null,
          fvc: dto.fvc ? Number(dto.fvc) : null,
          fvcPredicted: dto.fvcPredicted ? Number(dto.fvcPredicted) : null,
          fvcPctPredicted: fvcPctPredicted,
          fev1: dto.fev1 ? Number(dto.fev1) : null,
          fev1Predicted: dto.fev1Predicted ? Number(dto.fev1Predicted) : null,
          fev1PctPredicted: fev1PctPredicted,
          fev1Fvc: fev1Fvc,
          fev1FvcPredicted: dto.fev1FvcPredicted ? Number(dto.fev1FvcPredicted) : null,
          pef: dto.pef ? Number(dto.pef) : null,
          pefPredicted: dto.pefPredicted ? Number(dto.pefPredicted) : null,
          fef2575: dto.fef2575 ? Number(dto.fef2575) : null,
          fef2575Predicted: dto.fef2575Predicted ? Number(dto.fef2575Predicted) : null,
          qualityGrade: dto.qualityGrade || null,
          interpretation: dto.interpretation || null,
          pattern: dto.pattern || null,
          goldStage: goldStage,
          bdResponse: dto.bdResponse || null,
          technicianName: dto.technicianName || null,
          reviewedBy: dto.reviewedBy || null,
          equipmentId: dto.equipmentId || null,
          notes: dto.notes || null,
          status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.spirometryTest.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Test not found');

      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'patientGender', 'indication',
        'preBronchodilator', 'postBronchodilator', 'bronchodilatorUsed',
        'qualityGrade', 'interpretation', 'pattern', 'goldStage', 'bdResponse',
        'technicianName', 'reviewedBy', 'equipmentId', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'patientHeight', 'patientWeight',
        'fvc', 'fvcPredicted', 'fev1', 'fev1Predicted', 'pef', 'pefPredicted',
        'fef2575', 'fef2575Predicted', 'fev1FvcPredicted'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);

      // Recalculate derived values
      const fev1 = dto.fev1 !== undefined ? Number(dto.fev1) : existing.fev1;
      const fvc = dto.fvc !== undefined ? Number(dto.fvc) : existing.fvc;
      const fev1Pred = dto.fev1Predicted !== undefined ? Number(dto.fev1Predicted) : existing.fev1Predicted;
      const fvcPred = dto.fvcPredicted !== undefined ? Number(dto.fvcPredicted) : existing.fvcPredicted;
      if (fev1 && fvc) updateData.fev1Fvc = Math.round((fev1 / fvc) * 100 * 10) / 10;
      if (fev1 && fev1Pred) updateData.fev1PctPredicted = Math.round((fev1 / fev1Pred) * 100);
      if (fvc && fvcPred) updateData.fvcPctPredicted = Math.round((fvc / fvcPred) * 100);

      return await this.prisma.spirometryTest.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const where = { tenantId };
      const [total, byPattern, byGold] = await Promise.all([
        this.prisma.spirometryTest.count({ where }),
        this.prisma.spirometryTest.groupBy({ by: ['pattern'], where, _count: true }),
        this.prisma.spirometryTest.groupBy({ by: ['goldStage'], where, _count: true }),
      ]);
      return {
        total,
        byPattern: byPattern.filter(p => p.pattern).map(p => ({ pattern: p.pattern, count: p._count })),
        byGold: byGold.filter(g => g.goldStage).map(g => ({ stage: g.goldStage, count: g._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byPattern: [], byGold: [] }; }
  }
}
