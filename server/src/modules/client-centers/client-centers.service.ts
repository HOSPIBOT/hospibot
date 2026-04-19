import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClientCentersService {
  private readonly logger = new Logger(ClientCentersService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ centerName: { contains: search, mode: 'insensitive' } }, { contactPerson: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.clientCenter.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.clientCenter.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.clientCenter.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.centerName) throw new BadRequestException('Center name is required');
      return await this.prisma.clientCenter.create({
        data: {
          tenantId, centerName: dto.centerName,
          centerType: dto.centerType || null,
          contactPerson: dto.contactPerson || null,
          phone: dto.phone || null, email: dto.email || null,
          address: dto.address || null, city: dto.city || null, state: dto.state || null,
          contractStart: dto.contractStart ? new Date(dto.contractStart) : null,
          contractEnd: dto.contractEnd ? new Date(dto.contractEnd) : null,
          contractValue: dto.contractValue ? Number(dto.contractValue) : null,
          billingModel: dto.billingModel || 'per-study',
          modalitiesSupported: dto.modalitiesSupported || null,
          xrayRate: dto.xrayRate ? Number(dto.xrayRate) : null,
          ctRate: dto.ctRate ? Number(dto.ctRate) : null,
          mriRate: dto.mriRate ? Number(dto.mriRate) : null,
          usgRate: dto.usgRate ? Number(dto.usgRate) : null,
          mammoRate: dto.mammoRate ? Number(dto.mammoRate) : null,
          statSlaMinutes: dto.statSlaMinutes ? Number(dto.statSlaMinutes) : 30,
          routineSlaMinutes: dto.routineSlaMinutes ? Number(dto.routineSlaMinutes) : 480,
          prioritySlaMinutes: dto.prioritySlaMinutes ? Number(dto.prioritySlaMinutes) : 180,
          monthlyVolumeTarget: dto.monthlyVolumeTarget ? Number(dto.monthlyVolumeTarget) : null,
          pacsIntegrated: dto.pacsIntegrated || false,
          dicomNodeAet: dto.dicomNodeAet || null,
          vpnConfigured: dto.vpnConfigured || false,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.clientCenter.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['centerName', 'centerType', 'contactPerson', 'phone', 'email', 'address',
        'city', 'state', 'billingModel', 'modalitiesSupported', 'pacsIntegrated',
        'dicomNodeAet', 'vpnConfigured', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['contractValue', 'xrayRate', 'ctRate', 'mriRate', 'usgRate', 'mammoRate',
        'statSlaMinutes', 'routineSlaMinutes', 'prioritySlaMinutes', 'monthlyVolumeTarget'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.contractStart) updateData.contractStart = new Date(dto.contractStart);
      if (dto.contractEnd) updateData.contractEnd = new Date(dto.contractEnd);
      return await this.prisma.clientCenter.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, active] = await Promise.all([
        this.prisma.clientCenter.count({ where: { tenantId } }),
        this.prisma.clientCenter.count({ where: { tenantId, status: 'active' } }),
      ]);
      return { total, activeClients: active };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, activeClients: 0 }; }
  }
}
