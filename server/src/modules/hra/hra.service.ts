import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// India: Occupational Safety, Health & Working Conditions Code 2020
// Mandatory annual health screening for employees 40+
// WHO HRA: questionnaire + risk calculation + feedback
// NCD screening: HTN, diabetes, CVD, cancer risk

@Injectable()
export class HraService {
  private readonly logger = new Logger(HraService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, riskLevel, status, search } = query;
      const where: any = { tenantId };
      if (riskLevel) where.overallRiskLevel = riskLevel;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.healthRiskAssessment.findMany({ where, orderBy: { assessmentDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.healthRiskAssessment.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.healthRiskAssessment.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');

      // Auto-calculate BMI
      let bmi = null;
      let bmiCategory = null;
      if (dto.weightKg && dto.heightCm) {
        const h = Number(dto.heightCm) / 100;
        bmi = Math.round((Number(dto.weightKg) / (h * h)) * 10) / 10;
        if (bmi < 18.5) bmiCategory = 'Underweight';
        else if (bmi < 25) bmiCategory = 'Normal';
        else if (bmi < 30) bmiCategory = 'Overweight';
        else bmiCategory = 'Obese';
      }

      return await this.prisma.healthRiskAssessment.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          assessmentDate: dto.assessmentDate ? new Date(dto.assessmentDate) : new Date(),
          assessmentType: dto.assessmentType || 'comprehensive',
          employerId: dto.employerId || null, employerName: dto.employerName || null,
          // Biometrics
          heightCm: dto.heightCm ? Number(dto.heightCm) : null,
          weightKg: dto.weightKg ? Number(dto.weightKg) : null,
          bmi: bmi, bmiCategory: bmiCategory,
          waistCm: dto.waistCm ? Number(dto.waistCm) : null,
          systolicBp: dto.systolicBp ? Number(dto.systolicBp) : null,
          diastolicBp: dto.diastolicBp ? Number(dto.diastolicBp) : null,
          restingHr: dto.restingHr ? Number(dto.restingHr) : null,
          // Lab results (NCD screening)
          fastingGlucose: dto.fastingGlucose ? Number(dto.fastingGlucose) : null,
          hba1c: dto.hba1c ? Number(dto.hba1c) : null,
          totalCholesterol: dto.totalCholesterol ? Number(dto.totalCholesterol) : null,
          ldl: dto.ldl ? Number(dto.ldl) : null,
          hdl: dto.hdl ? Number(dto.hdl) : null,
          triglycerides: dto.triglycerides ? Number(dto.triglycerides) : null,
          creatinine: dto.creatinine ? Number(dto.creatinine) : null,
          // Lifestyle questionnaire
          smokingStatus: dto.smokingStatus || null,
          alcoholFrequency: dto.alcoholFrequency || null,
          exerciseFrequency: dto.exerciseFrequency || null,
          dietType: dto.dietType || null,
          stressLevel: dto.stressLevel || null,
          sleepHours: dto.sleepHours ? Number(dto.sleepHours) : null,
          familyHistoryDiabetes: dto.familyHistoryDiabetes || false,
          familyHistoryCardiac: dto.familyHistoryCardiac || false,
          familyHistoryCancer: dto.familyHistoryCancer || false,
          familyHistoryHypertension: dto.familyHistoryHypertension || false,
          // Risk scores
          diabetesRisk: dto.diabetesRisk || null,
          cardiovascularRisk: dto.cardiovascularRisk || null,
          overallRiskScore: dto.overallRiskScore ? Number(dto.overallRiskScore) : null,
          overallRiskLevel: dto.overallRiskLevel || null,
          // Recommendations
          recommendations: dto.recommendations || null,
          referrals: dto.referrals || null,
          followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
          assessedBy: dto.assessedBy || null,
          notes: dto.notes || null, status: dto.status || 'completed',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.healthRiskAssessment.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'assessmentType', 'employerId', 'employerName',
        'bmiCategory', 'smokingStatus', 'alcoholFrequency', 'exerciseFrequency', 'dietType',
        'stressLevel', 'familyHistoryDiabetes', 'familyHistoryCardiac', 'familyHistoryCancer',
        'familyHistoryHypertension', 'diabetesRisk', 'cardiovascularRisk', 'overallRiskLevel',
        'recommendations', 'referrals', 'assessedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'heightCm', 'weightKg', 'bmi', 'waistCm', 'systolicBp',
        'diastolicBp', 'restingHr', 'fastingGlucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl',
        'triglycerides', 'creatinine', 'sleepHours', 'overallRiskScore'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.assessmentDate) updateData.assessmentDate = new Date(dto.assessmentDate);
      if (dto.followUpDate) updateData.followUpDate = new Date(dto.followUpDate);
      return await this.prisma.healthRiskAssessment.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byRisk] = await Promise.all([
        this.prisma.healthRiskAssessment.count({ where: { tenantId } }),
        this.prisma.healthRiskAssessment.groupBy({ by: ['overallRiskLevel'], where: { tenantId }, _count: true }),
      ]);
      return { total, byRiskLevel: byRisk.filter(r => r.overallRiskLevel).map(r => ({ level: r.overallRiskLevel, count: r._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byRiskLevel: [] }; }
  }
}
