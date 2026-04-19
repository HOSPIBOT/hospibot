import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HolterAllocationService {
  private readonly logger = new Logger(HolterAllocationService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, deviceStatus, status, search } = query;
      const where: any = { tenantId };
      if (deviceStatus) where.deviceStatus = deviceStatus;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { deviceSerialNo: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.holterAllocation.findMany({ where, orderBy: { issuedAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.holterAllocation.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.holterAllocation.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.deviceSerialNo) throw new BadRequestException('Device serial number is required for asset tracking');

      return await this.prisma.holterAllocation.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          indication: dto.indication || null, referringDoctor: dto.referringDoctor || null,
          // Device asset tracking
          deviceSerialNo: dto.deviceSerialNo, deviceModel: dto.deviceModel || null,
          leadConfiguration: dto.leadConfiguration || '3-channel',
          duration: dto.duration || '24h',
          // Timing
          issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
          expectedReturn: dto.expectedReturn ? new Date(dto.expectedReturn) : null,
          returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : null,
          deviceStatus: dto.deviceStatus || 'issued',
          deviceCondition: dto.deviceCondition || null,
          // Recording quality
          recordingQuality: dto.recordingQuality || null,
          totalRecordedHours: dto.totalRecordedHours ? Number(dto.totalRecordedHours) : null,
          analyzablePercentage: dto.analyzablePercentage ? Number(dto.analyzablePercentage) : null,
          // ISHNE-HRS findings
          totalHeartbeats: dto.totalHeartbeats ? Number(dto.totalHeartbeats) : null,
          avgHeartRate: dto.avgHeartRate ? Number(dto.avgHeartRate) : null,
          minHeartRate: dto.minHeartRate ? Number(dto.minHeartRate) : null,
          maxHeartRate: dto.maxHeartRate ? Number(dto.maxHeartRate) : null,
          // Arrhythmia counts
          pvcCount: dto.pvcCount ? Number(dto.pvcCount) : null,
          pacCount: dto.pacCount ? Number(dto.pacCount) : null,
          ventTachyEpisodes: dto.ventTachyEpisodes ? Number(dto.ventTachyEpisodes) : null,
          svtEpisodes: dto.svtEpisodes ? Number(dto.svtEpisodes) : null,
          afEpisodes: dto.afEpisodes ? Number(dto.afEpisodes) : null,
          afBurdenPct: dto.afBurdenPct ? Number(dto.afBurdenPct) : null,
          pausesGt2s: dto.pausesGt2s ? Number(dto.pausesGt2s) : null,
          longestPauseSec: dto.longestPauseSec ? Number(dto.longestPauseSec) : null,
          stChanges: dto.stChanges || null,
          // Symptom diary correlation
          symptomDiary: dto.symptomDiary || null,
          symptomCorrelation: dto.symptomCorrelation || null,
          // HRV (per ISHNE-HRS)
          sdnn: dto.sdnn ? Number(dto.sdnn) : null,
          rmssd: dto.rmssd ? Number(dto.rmssd) : null,
          // Report
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          cardiologist: dto.cardiologist || null, technicianName: dto.technicianName || null,
          notes: dto.notes || null, status: dto.status || 'issued',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.holterAllocation.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'indication', 'referringDoctor', 'deviceSerialNo', 'deviceModel',
        'leadConfiguration', 'duration', 'deviceStatus', 'deviceCondition', 'recordingQuality',
        'stChanges', 'symptomCorrelation', 'interpretation', 'recommendation',
        'cardiologist', 'technicianName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'totalRecordedHours', 'analyzablePercentage', 'totalHeartbeats',
        'avgHeartRate', 'minHeartRate', 'maxHeartRate', 'pvcCount', 'pacCount',
        'ventTachyEpisodes', 'svtEpisodes', 'afEpisodes', 'afBurdenPct',
        'pausesGt2s', 'longestPauseSec', 'sdnn', 'rmssd'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['issuedAt', 'expectedReturn', 'returnedAt'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.symptomDiary) updateData.symptomDiary = dto.symptomDiary;
      return await this.prisma.holterAllocation.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, devicesOut, byDuration] = await Promise.all([
        this.prisma.holterAllocation.count({ where: { tenantId } }),
        this.prisma.holterAllocation.count({ where: { tenantId, deviceStatus: 'issued' } }),
        this.prisma.holterAllocation.groupBy({ by: ['duration'], where: { tenantId }, _count: true }),
      ]);
      return { total, devicesCurrentlyIssued: devicesOut, byDuration: byDuration.map(d => ({ duration: d.duration, count: d._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, devicesCurrentlyIssued: 0, byDuration: [] }; }
  }
}
