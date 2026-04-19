import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AudiometryService {
  private readonly logger = new Logger(AudiometryService.name);

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
        this.prisma.audiometryTest.findMany({
          where, orderBy: { testDate: 'desc' },
          skip: (page - 1) * limit, take: Number(limit),
        }),
        this.prisma.audiometryTest.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.audiometryTest.findFirst({ where: { id, tenantId } });
    } catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.testDate) throw new BadRequestException('Test date is required');

      // Auto-calculate PTA (Pure Tone Average) at 500, 1000, 2000 Hz
      const rightThresholds = dto.rightThresholds || {};
      const leftThresholds = dto.leftThresholds || {};
      const rightPta = this.calcPta(rightThresholds);
      const leftPta = this.calcPta(leftThresholds);

      // Auto-classify hearing loss per WHO grading
      const rightGrade = this.classifyHearingLoss(rightPta);
      const leftGrade = this.classifyHearingLoss(leftPta);

      return await this.prisma.audiometryTest.create({
        data: {
          tenantId,
          patientId: dto.patientId || null,
          patientName: dto.patientName,
          patientUhid: dto.patientUhid || null,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          testDate: new Date(dto.testDate),
          testType: dto.testType || 'pure-tone',
          indication: dto.indication || null,
          rightThresholds: rightThresholds,
          leftThresholds: leftThresholds,
          rightPta: rightPta,
          leftPta: leftPta,
          rightGrade: rightGrade,
          leftGrade: leftGrade,
          rightBoneConduction: dto.rightBoneConduction || null,
          leftBoneConduction: dto.leftBoneConduction || null,
          speechReceptionRight: dto.speechReceptionRight ? Number(dto.speechReceptionRight) : null,
          speechReceptionLeft: dto.speechReceptionLeft ? Number(dto.speechReceptionLeft) : null,
          speechDiscrimRight: dto.speechDiscrimRight ? Number(dto.speechDiscrimRight) : null,
          speechDiscrimLeft: dto.speechDiscrimLeft ? Number(dto.speechDiscrimLeft) : null,
          tympanometryRight: dto.tympanometryRight || null,
          tympanometryLeft: dto.tympanometryLeft || null,
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          audiologistName: dto.audiologistName || null,
          reviewedBy: dto.reviewedBy || null,
          equipmentId: dto.equipmentId || null,
          calibrationDate: dto.calibrationDate ? new Date(dto.calibrationDate) : null,
          notes: dto.notes || null,
          status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.audiometryTest.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Test not found');

      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'patientGender', 'testType', 'indication',
        'tympanometryRight', 'tympanometryLeft', 'interpretation', 'recommendation',
        'audiologistName', 'reviewedBy', 'equipmentId', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.patientAge !== undefined) updateData.patientAge = Number(dto.patientAge);
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      if (dto.calibrationDate) updateData.calibrationDate = new Date(dto.calibrationDate);
      if (dto.rightThresholds) {
        updateData.rightThresholds = dto.rightThresholds;
        updateData.rightPta = this.calcPta(dto.rightThresholds);
        updateData.rightGrade = this.classifyHearingLoss(updateData.rightPta);
      }
      if (dto.leftThresholds) {
        updateData.leftThresholds = dto.leftThresholds;
        updateData.leftPta = this.calcPta(dto.leftThresholds);
        updateData.leftGrade = this.classifyHearingLoss(updateData.leftPta);
      }
      const numFields = ['speechReceptionRight', 'speechReceptionLeft', 'speechDiscrimRight', 'speechDiscrimLeft'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.rightBoneConduction) updateData.rightBoneConduction = dto.rightBoneConduction;
      if (dto.leftBoneConduction) updateData.leftBoneConduction = dto.leftBoneConduction;

      return await this.prisma.audiometryTest.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byGradeR, byGradeL] = await Promise.all([
        this.prisma.audiometryTest.count({ where: { tenantId } }),
        this.prisma.audiometryTest.groupBy({ by: ['rightGrade'], where: { tenantId }, _count: true }),
        this.prisma.audiometryTest.groupBy({ by: ['leftGrade'], where: { tenantId }, _count: true }),
      ]);
      return {
        total,
        rightEarGrades: byGradeR.filter(g => g.rightGrade).map(g => ({ grade: g.rightGrade, count: g._count })),
        leftEarGrades: byGradeL.filter(g => g.leftGrade).map(g => ({ grade: g.leftGrade, count: g._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, rightEarGrades: [], leftEarGrades: [] }; }
  }

  private calcPta(thresholds: any): number | null {
    const hz500 = thresholds?.['500'];
    const hz1000 = thresholds?.['1000'];
    const hz2000 = thresholds?.['2000'];
    if (hz500 != null && hz1000 != null && hz2000 != null) {
      return Math.round(((Number(hz500) + Number(hz1000) + Number(hz2000)) / 3) * 10) / 10;
    }
    return null;
  }

  private classifyHearingLoss(pta: number | null): string | null {
    if (pta == null) return null;
    if (pta <= 25) return 'Normal';
    if (pta <= 40) return 'Mild';
    if (pta <= 55) return 'Moderate';
    if (pta <= 70) return 'Moderately Severe';
    if (pta <= 90) return 'Severe';
    return 'Profound';
  }
}
