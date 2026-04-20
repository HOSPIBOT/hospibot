import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// India Factories Act 1948 (Forms 32/33), Labour Code 2020
// Corporate health camps: on-site/off-site, test menu, staffing, bulk registration

@Injectable()
export class HealthCampsService {
  private readonly logger = new Logger(HealthCampsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, campType, status, search } = query;
      const where: any = { tenantId };
      if (campType) where.campType = campType;
      if (status) where.status = status;
      if (search) { where.OR = [{ campName: { contains: search, mode: 'insensitive' } }, { corporateClient: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.healthCamp.findMany({ where, orderBy: { campDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.healthCamp.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.healthCamp.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.campName) throw new BadRequestException('Camp name required');
      if (!dto.campDate) throw new BadRequestException('Camp date required');

      return await this.prisma.healthCamp.create({
        data: {
          tenantId, campName: dto.campName, campType: dto.campType || 'corporate',
          campDate: new Date(dto.campDate),
          campEndDate: dto.campEndDate ? new Date(dto.campEndDate) : null,
          // Venue
          venue: dto.venue || null, venueAddress: dto.venueAddress || null,
          venueCity: dto.venueCity || null, onSite: dto.onSite || true,
          // Client
          corporateClient: dto.corporateClient || null, corporateContactPerson: dto.corporateContactPerson || null,
          corporatePhone: dto.corporatePhone || null, contractId: dto.contractId || null,
          // Test menu
          testMenu: dto.testMenu || null, packageName: dto.packageName || null,
          testCount: dto.testCount ? Number(dto.testCount) : null,
          includesConsultation: dto.includesConsultation || false,
          includesEcg: dto.includesEcg || false,
          includesXray: dto.includesXray || false,
          includesUsg: dto.includesUsg || false,
          // Staffing
          staffAssigned: dto.staffAssigned || null,
          phlebotomistCount: dto.phlebotomistCount ? Number(dto.phlebotomistCount) : null,
          doctorCount: dto.doctorCount ? Number(dto.doctorCount) : null,
          technicianCount: dto.technicianCount ? Number(dto.technicianCount) : null,
          coordinatorName: dto.coordinatorName || null,
          // Registration
          expectedParticipants: dto.expectedParticipants ? Number(dto.expectedParticipants) : null,
          registeredCount: dto.registeredCount ? Number(dto.registeredCount) : 0,
          completedCount: dto.completedCount ? Number(dto.completedCount) : 0,
          noShowCount: dto.noShowCount ? Number(dto.noShowCount) : 0,
          // Equipment
          equipmentList: dto.equipmentList || null,
          coldChainRequired: dto.coldChainRequired || false,
          // Billing
          perPersonRate: dto.perPersonRate ? Number(dto.perPersonRate) : null,
          totalBilledAmount: dto.totalBilledAmount ? Number(dto.totalBilledAmount) : null,
          paymentStatus: dto.paymentStatus || null,
          notes: dto.notes || null, status: dto.status || 'planned',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.healthCamp.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['campName', 'campType', 'venue', 'venueAddress', 'venueCity', 'onSite',
        'corporateClient', 'corporateContactPerson', 'corporatePhone', 'contractId',
        'packageName', 'includesConsultation', 'includesEcg', 'includesXray', 'includesUsg',
        'coordinatorName', 'coldChainRequired', 'paymentStatus', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['testCount', 'phlebotomistCount', 'doctorCount', 'technicianCount',
        'expectedParticipants', 'registeredCount', 'completedCount', 'noShowCount',
        'perPersonRate', 'totalBilledAmount'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.campDate) updateData.campDate = new Date(dto.campDate);
      if (dto.campEndDate) updateData.campEndDate = new Date(dto.campEndDate);
      if (dto.testMenu) updateData.testMenu = dto.testMenu;
      if (dto.staffAssigned) updateData.staffAssigned = dto.staffAssigned;
      if (dto.equipmentList) updateData.equipmentList = dto.equipmentList;
      return await this.prisma.healthCamp.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, upcoming] = await Promise.all([
        this.prisma.healthCamp.count({ where: { tenantId } }),
        this.prisma.healthCamp.groupBy({ by: ['campType'], where: { tenantId }, _count: true }),
        this.prisma.healthCamp.count({ where: { tenantId, campDate: { gte: new Date() }, status: 'planned' } }),
      ]);
      return { total, upcomingCamps: upcoming, byType: byType.map(t => ({ type: t.campType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, upcomingCamps: 0, byType: [] }; }
  }
}
