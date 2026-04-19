import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CryopreservationService {
  private readonly logger = new Logger(CryopreservationService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, specimenType, status, search } = query;
      const where: any = { tenantId };
      if (specimenType) where.specimenType = specimenType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { strawId: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.cryoStorage.findMany({ where, orderBy: { freezeDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.cryoStorage.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.cryoStorage.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.specimenType) throw new BadRequestException('Specimen type is required');
      if (!dto.consentCryoStorage) throw new BadRequestException('Cryostorage consent (ART Act Form 15/16) is mandatory');

      return await this.prisma.cryoStorage.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          partnerName: dto.partnerName || null, specimenType: dto.specimenType,
          strawId: dto.strawId || `CRYO-${Date.now().toString(36).toUpperCase()}`,
          strawCount: dto.strawCount ? Number(dto.strawCount) : 1,
          freezeMethod: dto.freezeMethod || 'vitrification',
          freezeDate: dto.freezeDate ? new Date(dto.freezeDate) : new Date(),
          embryoStage: dto.embryoStage || null, embryoGrade: dto.embryoGrade || null,
          embryoDay: dto.embryoDay ? Number(dto.embryoDay) : null,
          oocyteMaturity: dto.oocyteMaturity || null, spermSource: dto.spermSource || null,
          tankId: dto.tankId || null, canisterId: dto.canisterId || null,
          caneId: dto.caneId || null, gobletId: dto.gobletId || null, position: dto.position || null,
          ln2Level: dto.ln2Level || null,
          consentCryoStorage: true,
          consentDisposal: dto.consentDisposal || null,
          storageStartDate: dto.freezeDate ? new Date(dto.freezeDate) : new Date(),
          storageFeeStatus: dto.storageFeeStatus || 'paid',
          renewalDueDate: dto.renewalDueDate ? new Date(dto.renewalDueDate) : null,
          thawDate: dto.thawDate ? new Date(dto.thawDate) : null,
          thawSurvival: dto.thawSurvival || null,
          thawBy: dto.thawBy || null,
          notes: dto.notes || null, status: dto.status || 'stored',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.cryoStorage.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'partnerName', 'specimenType', 'strawId', 'freezeMethod',
        'embryoStage', 'embryoGrade', 'oocyteMaturity', 'spermSource',
        'tankId', 'canisterId', 'caneId', 'gobletId', 'position', 'ln2Level',
        'consentDisposal', 'storageFeeStatus', 'thawSurvival', 'thawBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.strawCount !== undefined) updateData.strawCount = Number(dto.strawCount);
      if (dto.embryoDay !== undefined) updateData.embryoDay = Number(dto.embryoDay);
      const dateFields = ['freezeDate', 'renewalDueDate', 'thawDate', 'storageStartDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.cryoStorage.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, byStatus, expiring] = await Promise.all([
        this.prisma.cryoStorage.count({ where: { tenantId } }),
        this.prisma.cryoStorage.groupBy({ by: ['specimenType'], where: { tenantId }, _count: true }),
        this.prisma.cryoStorage.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
        this.prisma.cryoStorage.count({ where: { tenantId, renewalDueDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }, status: 'stored' } }),
      ]);
      return { total, expiring, byType: byType.map(t => ({ type: t.specimenType, count: t._count })), byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, expiring: 0, byType: [], byStatus: [] }; }
  }
}
