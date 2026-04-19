import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Bruce Protocol stages — speed (mph), grade (%), METs
const BRUCE_STAGES = [
  { stage: 1, speed: 1.7, grade: 10, mets: 4.6 },
  { stage: 2, speed: 2.5, grade: 12, mets: 7.0 },
  { stage: 3, speed: 3.4, grade: 14, mets: 10.1 },
  { stage: 4, speed: 4.2, grade: 16, mets: 12.9 },
  { stage: 5, speed: 5.0, grade: 18, mets: 15.0 },
  { stage: 6, speed: 5.5, grade: 20, mets: 16.9 },
  { stage: 7, speed: 6.0, grade: 22, mets: 19.1 },
];

@Injectable()
export class TmtStressService {
  private readonly logger = new Logger(TmtStressService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, result, status, search } = query;
      const where: any = { tenantId };
      if (result) where.overallResult = result;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.tmtStress.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.tmtStress.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.tmtStress.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.testDate) throw new BadRequestException('Test date is required');

      // Calculate target HR (85% of 220 - age)
      const age = dto.patientAge ? Number(dto.patientAge) : null;
      const maxHr = age ? 220 - age : null;
      const targetHr = maxHr ? Math.round(maxHr * 0.85) : null;
      const achievedHr = dto.maxHeartRate ? Number(dto.maxHeartRate) : null;
      const targetAchieved = (targetHr && achievedHr) ? achievedHr >= targetHr : null;

      // METs from max stage achieved
      const maxStage = dto.maxStageCompleted ? Number(dto.maxStageCompleted) : null;
      const metsAchieved = maxStage ? BRUCE_STAGES.find(s => s.stage === maxStage)?.mets || null : null;

      return await this.prisma.tmtStress.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: age, patientGender: dto.patientGender || null,
          patientWeight: dto.patientWeight ? Number(dto.patientWeight) : null,
          testDate: new Date(dto.testDate),
          protocol: dto.protocol || 'standard-bruce',
          indication: dto.indication || null,
          medications: dto.medications || null,
          // Resting vitals
          restingHr: dto.restingHr ? Number(dto.restingHr) : null,
          restingSbp: dto.restingSbp ? Number(dto.restingSbp) : null,
          restingDbp: dto.restingDbp ? Number(dto.restingDbp) : null,
          restingEcg: dto.restingEcg || null,
          // Exercise
          maxStageCompleted: maxStage,
          exerciseDurationMin: dto.exerciseDurationMin ? Number(dto.exerciseDurationMin) : null,
          metsAchieved: metsAchieved,
          maxHeartRate: achievedHr, targetHeartRate: targetHr,
          targetAchieved: targetAchieved,
          peakSbp: dto.peakSbp ? Number(dto.peakSbp) : null,
          peakDbp: dto.peakDbp ? Number(dto.peakDbp) : null,
          reasonStopped: dto.reasonStopped || null,
          // ECG findings
          stSegmentChanges: dto.stSegmentChanges || null,
          stDepressionMm: dto.stDepressionMm ? Number(dto.stDepressionMm) : null,
          stDepressionLeads: dto.stDepressionLeads || null,
          stOnsetStage: dto.stOnsetStage ? Number(dto.stOnsetStage) : null,
          stRecoveryMin: dto.stRecoveryMin ? Number(dto.stRecoveryMin) : null,
          arrhythmias: dto.arrhythmias || null,
          chestPain: dto.chestPain || false, chestPainOnset: dto.chestPainOnset || null,
          dyspnea: dto.dyspnea || false, dizziness: dto.dizziness || false,
          // Recovery
          recoveryHr5min: dto.recoveryHr5min ? Number(dto.recoveryHr5min) : null,
          recoveryBp5min: dto.recoveryBp5min || null,
          recoveryEcgNormal: dto.recoveryEcgNormal || null,
          // Result
          overallResult: dto.overallResult || null,
          dukeScore: dto.dukeScore ? Number(dto.dukeScore) : null,
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          // Staff
          cardiologist: dto.cardiologist || null, technicianName: dto.technicianName || null,
          emergencyEquipmentChecked: dto.emergencyEquipmentChecked || false,
          defibrillatorAvailable: dto.defibrillatorAvailable || false,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.tmtStress.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'protocol', 'indication', 'medications',
        'restingEcg', 'reasonStopped', 'stSegmentChanges', 'stDepressionLeads',
        'arrhythmias', 'chestPain', 'chestPainOnset', 'dyspnea', 'dizziness',
        'recoveryBp5min', 'recoveryEcgNormal', 'overallResult', 'interpretation',
        'recommendation', 'cardiologist', 'technicianName', 'emergencyEquipmentChecked',
        'defibrillatorAvailable', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'patientWeight', 'restingHr', 'restingSbp', 'restingDbp',
        'maxStageCompleted', 'exerciseDurationMin', 'maxHeartRate', 'peakSbp', 'peakDbp',
        'stDepressionMm', 'stOnsetStage', 'stRecoveryMin', 'recoveryHr5min', 'dukeScore'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      return await this.prisma.tmtStress.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byResult] = await Promise.all([
        this.prisma.tmtStress.count({ where: { tenantId } }),
        this.prisma.tmtStress.groupBy({ by: ['overallResult'], where: { tenantId }, _count: true }),
      ]);
      return { total, byResult: byResult.filter(r => r.overallResult).map(r => ({ result: r.overallResult, count: r._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byResult: [] }; }
  }
}
