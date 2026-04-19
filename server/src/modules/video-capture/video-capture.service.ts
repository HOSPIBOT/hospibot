import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VideoCaptureService {
  private readonly logger = new Logger(VideoCaptureService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, procedureType, status, search } = query;
      const where: any = { tenantId };
      if (procedureType) where.procedureType = procedureType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { recordingId: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.videoCapture.findMany({ where, orderBy: { procedureDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.videoCapture.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.videoCapture.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.procedureType) throw new BadRequestException('Procedure type is required');
      return await this.prisma.videoCapture.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientUhid: dto.patientUhid || null,
          recordingId: dto.recordingId || `VID-${Date.now().toString(36).toUpperCase()}`,
          procedureDate: dto.procedureDate ? new Date(dto.procedureDate) : new Date(),
          procedureType: dto.procedureType,
          scopeType: dto.scopeType || null, scopeId: dto.scopeId || null,
          endoscopist: dto.endoscopist || null,
          recordingStart: dto.recordingStart || null, recordingEnd: dto.recordingEnd || null,
          durationMinutes: dto.durationMinutes ? Number(dto.durationMinutes) : null,
          imageCount: dto.imageCount ? Number(dto.imageCount) : null,
          videoFileRef: dto.videoFileRef || null,
          landmarks: dto.landmarks || null,
          findings: dto.findings || null,
          biopsySites: dto.biopsySites || null, biopsyCount: dto.biopsyCount ? Number(dto.biopsyCount) : null,
          completionStatus: dto.completionStatus || null,
          cecalIntubation: dto.cecalIntubation || false,
          withdrawalTime: dto.withdrawalTime || null,
          bostonPrepScore: dto.bostonPrepScore ? Number(dto.bostonPrepScore) : null,
          polypsFound: dto.polypsFound ? Number(dto.polypsFound) : null,
          polypectomyDone: dto.polypectomyDone || false,
          notes: dto.notes || null, status: dto.status || 'recorded',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.videoCapture.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'procedureType', 'scopeType', 'scopeId',
        'endoscopist', 'recordingStart', 'recordingEnd', 'videoFileRef',
        'findings', 'completionStatus', 'cecalIntubation', 'withdrawalTime',
        'polypectomyDone', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['durationMinutes', 'imageCount', 'biopsyCount', 'bostonPrepScore', 'polypsFound'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.procedureDate) updateData.procedureDate = new Date(dto.procedureDate);
      if (dto.landmarks) updateData.landmarks = dto.landmarks;
      if (dto.biopsySites) updateData.biopsySites = dto.biopsySites;
      return await this.prisma.videoCapture.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byProc] = await Promise.all([
        this.prisma.videoCapture.count({ where: { tenantId } }),
        this.prisma.videoCapture.groupBy({ by: ['procedureType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byProcedure: byProc.map(p => ({ type: p.procedureType, count: p._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byProcedure: [] }; }
  }
}
