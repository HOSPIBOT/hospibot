import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Partner/referral lab management
// NABL 112A: referral lab must be NABL-accredited for referred tests
// Rate agreements, sample transit tracking, TAT monitoring

@Injectable()
export class PartnerLabsService {
  private readonly logger = new Logger(PartnerLabsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, partnerType, status, search } = query;
      const where: any = { tenantId };
      if (partnerType) where.partnerType = partnerType;
      if (status) where.status = status;
      if (search) { where.OR = [{ labName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.partnerLab.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.partnerLab.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.partnerLab.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.labName) throw new BadRequestException('Partner lab name required');
      return await this.prisma.partnerLab.create({
        data: {
          tenantId, labName: dto.labName, partnerType: dto.partnerType || 'referral',
          labCode: dto.labCode || null, contactPerson: dto.contactPerson || null,
          phone: dto.phone || null, email: dto.email || null,
          address: dto.address || null, city: dto.city || null, state: dto.state || null,
          // Accreditation (NABL requirement for referral)
          nablAccredited: dto.nablAccredited || false,
          nablCertNo: dto.nablCertNo || null, nablExpiry: dto.nablExpiry ? new Date(dto.nablExpiry) : null,
          capAccredited: dto.capAccredited || false,
          // Rate agreement
          rateCardEffective: dto.rateCardEffective ? new Date(dto.rateCardEffective) : null,
          rateCardExpiry: dto.rateCardExpiry ? new Date(dto.rateCardExpiry) : null,
          rateCard: dto.rateCard || null,
          commissionPct: dto.commissionPct ? Number(dto.commissionPct) : null,
          paymentTermsDays: dto.paymentTermsDays ? Number(dto.paymentTermsDays) : null,
          // Test capability
          testsOffered: dto.testsOffered || null,
          specializations: dto.specializations || null,
          modalitiesAvailable: dto.modalitiesAvailable || null,
          // TAT SLA
          routineTatHours: dto.routineTatHours ? Number(dto.routineTatHours) : null,
          statTatHours: dto.statTatHours ? Number(dto.statTatHours) : null,
          // Logistics
          samplePickupAvailable: dto.samplePickupAvailable || false,
          pickupSchedule: dto.pickupSchedule || null,
          coldChainAvailable: dto.coldChainAvailable || false,
          courierPartner: dto.courierPartner || null,
          // Performance
          totalSamplesReferred: dto.totalSamplesReferred ? Number(dto.totalSamplesReferred) : 0,
          avgTatAchieved: dto.avgTatAchieved ? Number(dto.avgTatAchieved) : null,
          tatBreachCount: dto.tatBreachCount ? Number(dto.tatBreachCount) : 0,
          qualityConcordance: dto.qualityConcordance ? Number(dto.qualityConcordance) : null,
          rejectionRate: dto.rejectionRate ? Number(dto.rejectionRate) : null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.partnerLab.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['labName', 'partnerType', 'labCode', 'contactPerson', 'phone', 'email',
        'address', 'city', 'state', 'nablAccredited', 'nablCertNo', 'capAccredited',
        'samplePickupAvailable', 'pickupSchedule', 'coldChainAvailable', 'courierPartner', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['commissionPct', 'paymentTermsDays', 'routineTatHours', 'statTatHours',
        'totalSamplesReferred', 'avgTatAchieved', 'tatBreachCount', 'qualityConcordance', 'rejectionRate'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['nablExpiry', 'rateCardEffective', 'rateCardExpiry'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.rateCard) updateData.rateCard = dto.rateCard;
      if (dto.testsOffered) updateData.testsOffered = dto.testsOffered;
      if (dto.specializations) updateData.specializations = dto.specializations;
      if (dto.modalitiesAvailable) updateData.modalitiesAvailable = dto.modalitiesAvailable;
      return await this.prisma.partnerLab.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, nablCount, byType] = await Promise.all([
        this.prisma.partnerLab.count({ where: { tenantId } }),
        this.prisma.partnerLab.count({ where: { tenantId, nablAccredited: true } }),
        this.prisma.partnerLab.groupBy({ by: ['partnerType'], where: { tenantId }, _count: true }),
      ]);
      return { total, nablAccredited: nablCount, byType: byType.map(t => ({ type: t.partnerType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, nablAccredited: 0, byType: [] }; }
  }
}
