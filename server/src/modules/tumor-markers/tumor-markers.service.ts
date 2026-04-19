import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TumorMarkersService {
  private readonly logger = new Logger(TumorMarkersService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, markerName, status, search } = query;
      const where: any = { tenantId };
      if (markerName) where.markerName = { contains: markerName, mode: 'insensitive' };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { markerName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.tumorMarker.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.tumorMarker.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.tumorMarker.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.markerName) throw new BadRequestException('Tumor marker name is required');

      // Auto-flag if value exceeds reference range
      const isElevated = dto.value && dto.referenceMax ? Number(dto.value) > Number(dto.referenceMax) : false;

      return await this.prisma.tumorMarker.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientUhid: dto.patientUhid || null, patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          testDate: dto.testDate ? new Date(dto.testDate) : new Date(),
          markerName: dto.markerName, markerCode: dto.markerCode || null,
          cancerType: dto.cancerType || null,
          value: dto.value ? Number(dto.value) : null, unit: dto.unit || null,
          referenceMin: dto.referenceMin ? Number(dto.referenceMin) : null,
          referenceMax: dto.referenceMax ? Number(dto.referenceMax) : null,
          isElevated: isElevated,
          previousValue: dto.previousValue ? Number(dto.previousValue) : null,
          previousDate: dto.previousDate ? new Date(dto.previousDate) : null,
          trend: dto.trend || null,
          method: dto.method || null, specimenType: dto.specimenType || 'serum',
          clinicalHistory: dto.clinicalHistory || null,
          interpretation: dto.interpretation || null,
          recommendation: dto.recommendation || null,
          orderedBy: dto.orderedBy || null, reportedBy: dto.reportedBy || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.tumorMarker.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'patientGender', 'markerName', 'markerCode',
        'cancerType', 'unit', 'trend', 'method', 'specimenType', 'clinicalHistory',
        'interpretation', 'recommendation', 'orderedBy', 'reportedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'value', 'referenceMin', 'referenceMax', 'previousValue'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      if (dto.previousDate) updateData.previousDate = new Date(dto.previousDate);
      if (dto.value !== undefined && dto.referenceMax !== undefined) {
        updateData.isElevated = Number(dto.value) > Number(dto.referenceMax);
      }
      return await this.prisma.tumorMarker.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, elevated, byMarker] = await Promise.all([
        this.prisma.tumorMarker.count({ where: { tenantId } }),
        this.prisma.tumorMarker.count({ where: { tenantId, isElevated: true } }),
        this.prisma.tumorMarker.groupBy({ by: ['markerName'], where: { tenantId }, _count: true }),
      ]);
      return { total, elevated, byMarker: byMarker.map(m => ({ marker: m.markerName, count: m._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, elevated: 0, byMarker: [] }; }
  }
}
