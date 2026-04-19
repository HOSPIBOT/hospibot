import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SedationLogService {
  private readonly logger = new Logger(SedationLogService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, asaClass, status, search } = query;
      const where: any = { tenantId };
      if (asaClass) where.asaClass = asaClass;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.sedationLog.findMany({ where, orderBy: { procedureDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.sedationLog.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.sedationLog.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.procedureDate) throw new BadRequestException('Procedure date is required');
      if (!dto.sedationConsent) throw new BadRequestException('Sedation consent is mandatory before any sedation procedure');

      return await this.prisma.sedationLog.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientWeight: dto.patientWeight ? Number(dto.patientWeight) : null,
          procedureDate: new Date(dto.procedureDate), procedureType: dto.procedureType || null,
          asaClass: dto.asaClass || null,
          allergies: dto.allergies || null, comorbidities: dto.comorbidities || null,
          fastingHours: dto.fastingHours ? Number(dto.fastingHours) : null,
          fastingConfirmed: dto.fastingConfirmed || false,
          sedationConsent: true,
          sedationType: dto.sedationType || 'moderate',
          drugs: dto.drugs || null,
          preVitals: dto.preVitals || null, intraVitals: dto.intraVitals || null, postVitals: dto.postVitals || null,
          oxygenDelivery: dto.oxygenDelivery || null, oxygenFlow: dto.oxygenFlow || null,
          sedationStartTime: dto.sedationStartTime || null, sedationEndTime: dto.sedationEndTime || null,
          recoveryStartTime: dto.recoveryStartTime || null, dischargeTime: dto.dischargeTime || null,
          aldretScore: dto.aldretScore ? Number(dto.aldretScore) : null,
          complications: dto.complications || null, adverseEvents: dto.adverseEvents || null,
          endoscopist: dto.endoscopist || null, sedationist: dto.sedationist || null,
          nurseName: dto.nurseName || null,
          dischargeInstructions: dto.dischargeInstructions || false,
          escortPresent: dto.escortPresent || false,
          notes: dto.notes || null, status: dto.status || 'in-progress',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.sedationLog.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'procedureType', 'asaClass', 'allergies', 'comorbidities',
        'fastingConfirmed', 'sedationType', 'oxygenDelivery', 'oxygenFlow',
        'sedationStartTime', 'sedationEndTime', 'recoveryStartTime', 'dischargeTime',
        'complications', 'adverseEvents', 'endoscopist', 'sedationist', 'nurseName',
        'dischargeInstructions', 'escortPresent', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.patientAge !== undefined) updateData.patientAge = Number(dto.patientAge);
      if (dto.patientWeight !== undefined) updateData.patientWeight = Number(dto.patientWeight);
      if (dto.fastingHours !== undefined) updateData.fastingHours = Number(dto.fastingHours);
      if (dto.aldretScore !== undefined) updateData.aldretScore = Number(dto.aldretScore);
      if (dto.procedureDate) updateData.procedureDate = new Date(dto.procedureDate);
      if (dto.drugs) updateData.drugs = dto.drugs;
      if (dto.preVitals) updateData.preVitals = dto.preVitals;
      if (dto.intraVitals) updateData.intraVitals = dto.intraVitals;
      if (dto.postVitals) updateData.postVitals = dto.postVitals;
      return await this.prisma.sedationLog.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, adverse] = await Promise.all([
        this.prisma.sedationLog.count({ where: { tenantId } }),
        this.prisma.sedationLog.groupBy({ by: ['sedationType'], where: { tenantId }, _count: true }),
        this.prisma.sedationLog.count({ where: { tenantId, adverseEvents: { not: null } } }),
      ]);
      return { total, adverseEvents: adverse, byType: byType.map(t => ({ type: t.sedationType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, adverseEvents: 0, byType: [] }; }
  }
}
