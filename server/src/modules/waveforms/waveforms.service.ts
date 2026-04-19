import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WaveformsService {
  private readonly logger = new Logger(WaveformsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, studyType, status, search } = query;
      const where: any = { tenantId };
      if (studyType) where.studyType = studyType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.waveformStudy.findMany({ where, orderBy: { studyDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.waveformStudy.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.waveformStudy.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.studyType) throw new BadRequestException('Study type is required');
      return await this.prisma.waveformStudy.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null, patientGender: dto.patientGender || null,
          studyDate: dto.studyDate ? new Date(dto.studyDate) : new Date(),
          studyType: dto.studyType,
          indication: dto.indication || null,
          medicationList: dto.medicationList || null,
          sleepDeprived: dto.sleepDeprived || false,
          montage: dto.montage || null, channelCount: dto.channelCount ? Number(dto.channelCount) : null,
          recordingDuration: dto.recordingDuration ? Number(dto.recordingDuration) : null,
          activationProcedures: dto.activationProcedures || null,
          backgroundActivity: dto.backgroundActivity || null,
          abnormalFindings: dto.abnormalFindings || null,
          epileptiformActivity: dto.epileptiformActivity || null,
          nervesStudied: dto.nervesStudied || null,
          conductionVelocities: dto.conductionVelocities || null,
          amplitudes: dto.amplitudes || null,
          latencies: dto.latencies || null,
          fWaves: dto.fWaves || null,
          needleEmgFindings: dto.needleEmgFindings || null,
          interpretation: dto.interpretation || null,
          clinicalCorrelation: dto.clinicalCorrelation || null,
          neurophysiologist: dto.neurophysiologist || null, technicianName: dto.technicianName || null,
          equipmentId: dto.equipmentId || null, fileReference: dto.fileReference || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.waveformStudy.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'studyType', 'indication', 'medicationList',
        'sleepDeprived', 'montage', 'activationProcedures', 'backgroundActivity',
        'abnormalFindings', 'epileptiformActivity', 'nervesStudied', 'needleEmgFindings',
        'interpretation', 'clinicalCorrelation', 'neurophysiologist', 'technicianName',
        'equipmentId', 'fileReference', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'channelCount', 'recordingDuration'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.studyDate) updateData.studyDate = new Date(dto.studyDate);
      const jsonFields = ['conductionVelocities', 'amplitudes', 'latencies', 'fWaves'];
      for (const f of jsonFields) { if (dto[f]) updateData[f] = dto[f]; }
      return await this.prisma.waveformStudy.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType] = await Promise.all([
        this.prisma.waveformStudy.count({ where: { tenantId } }),
        this.prisma.waveformStudy.groupBy({ by: ['studyType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byType: byType.map(t => ({ type: t.studyType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [] }; }
  }
}
