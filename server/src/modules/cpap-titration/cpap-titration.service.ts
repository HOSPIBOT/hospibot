import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CpapTitrationService {
  private readonly logger = new Logger(CpapTitrationService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.cpapTitration.findMany({ where, orderBy: { studyDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.cpapTitration.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.cpapTitration.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      return await this.prisma.cpapTitration.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          diagnosticAhi: dto.diagnosticAhi ? Number(dto.diagnosticAhi) : null,
          studyDate: dto.studyDate ? new Date(dto.studyDate) : new Date(),
          studyType: dto.studyType || 'full-night',
          deviceType: dto.deviceType || 'CPAP', deviceModel: dto.deviceModel || null,
          maskType: dto.maskType || null, maskSize: dto.maskSize || null,
          startPressure: dto.startPressure ? Number(dto.startPressure) : null,
          optimalPressure: dto.optimalPressure ? Number(dto.optimalPressure) : null,
          maxPressure: dto.maxPressure ? Number(dto.maxPressure) : null,
          epapPressure: dto.epapPressure ? Number(dto.epapPressure) : null,
          ipapPressure: dto.ipapPressure ? Number(dto.ipapPressure) : null,
          residualAhi: dto.residualAhi ? Number(dto.residualAhi) : null,
          supineResidualAhi: dto.supineResidualAhi ? Number(dto.supineResidualAhi) : null,
          avgLeak: dto.avgLeak ? Number(dto.avgLeak) : null, maxLeak: dto.maxLeak ? Number(dto.maxLeak) : null,
          totalUsageHours: dto.totalUsageHours ? Number(dto.totalUsageHours) : null,
          lowestSpo2: dto.lowestSpo2 ? Number(dto.lowestSpo2) : null,
          meanSpo2: dto.meanSpo2 ? Number(dto.meanSpo2) : null,
          supplementalO2: dto.supplementalO2 || false, o2FlowRate: dto.o2FlowRate || null,
          sleepQualityOnPap: dto.sleepQualityOnPap || null,
          patientTolerance: dto.patientTolerance || null,
          recommendation: dto.recommendation || null,
          prescribedPressure: dto.prescribedPressure || null,
          prescribedDevice: dto.prescribedDevice || null,
          sleepPhysician: dto.sleepPhysician || null, technicianName: dto.technicianName || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.cpapTitration.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'studyType', 'deviceType', 'deviceModel', 'maskType', 'maskSize',
        'supplementalO2', 'o2FlowRate', 'sleepQualityOnPap', 'patientTolerance',
        'recommendation', 'prescribedPressure', 'prescribedDevice',
        'sleepPhysician', 'technicianName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['diagnosticAhi', 'startPressure', 'optimalPressure', 'maxPressure',
        'epapPressure', 'ipapPressure', 'residualAhi', 'supineResidualAhi',
        'avgLeak', 'maxLeak', 'totalUsageHours', 'lowestSpo2', 'meanSpo2'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.studyDate) updateData.studyDate = new Date(dto.studyDate);
      return await this.prisma.cpapTitration.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byDevice] = await Promise.all([
        this.prisma.cpapTitration.count({ where: { tenantId } }),
        this.prisma.cpapTitration.groupBy({ by: ['deviceType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byDevice: byDevice.map(d => ({ device: d.deviceType, count: d._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byDevice: [] }; }
  }
}
