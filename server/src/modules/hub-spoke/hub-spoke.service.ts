import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Hub-Spoke model for reference/chain labs
// NABL: single certificate with annexure listing all locations
// DLPL model: hub (full array) + spokes (collection/limited testing)
// Test routing rules, capacity planning, TAT optimization

@Injectable()
export class HubSpokeService {
  private readonly logger = new Logger(HubSpokeService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, nodeType, status, search } = query;
      const where: any = { tenantId };
      if (nodeType) where.nodeType = nodeType;
      if (status) where.status = status;
      if (search) { where.OR = [{ nodeName: { contains: search, mode: 'insensitive' } }, { nodeCode: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.hubSpokeNode.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.hubSpokeNode.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.hubSpokeNode.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.nodeName) throw new BadRequestException('Node name required');
      if (!dto.nodeType) throw new BadRequestException('Node type required (hub/spoke/collection-center/pickup-point)');
      return await this.prisma.hubSpokeNode.create({
        data: {
          tenantId, nodeName: dto.nodeName, nodeCode: dto.nodeCode || null,
          nodeType: dto.nodeType,
          parentHubId: dto.parentHubId || null,
          address: dto.address || null, city: dto.city || null, state: dto.state || null,
          pincode: dto.pincode || null, latitude: dto.latitude ? Number(dto.latitude) : null,
          longitude: dto.longitude ? Number(dto.longitude) : null,
          contactPerson: dto.contactPerson || null, phone: dto.phone || null,
          // Accreditation
          nablCovered: dto.nablCovered || false,
          nablAnnexureRef: dto.nablAnnexureRef || null,
          // Capacity
          dailyCapacity: dto.dailyCapacity ? Number(dto.dailyCapacity) : null,
          currentUtilization: dto.currentUtilization ? Number(dto.currentUtilization) : null,
          // Test routing
          testsAvailableLocally: dto.testsAvailableLocally || null,
          testsRoutedToHub: dto.testsRoutedToHub || null,
          routingRules: dto.routingRules || null,
          // Logistics
          pickupSchedule: dto.pickupSchedule || null,
          transitTimeHours: dto.transitTimeHours ? Number(dto.transitTimeHours) : null,
          coldChainAvailable: dto.coldChainAvailable || false,
          runnerAssigned: dto.runnerAssigned || null,
          // Operations
          operatingHours: dto.operatingHours || null,
          staffCount: dto.staffCount ? Number(dto.staffCount) : null,
          equipmentList: dto.equipmentList || null,
          // Performance
          samplesProcessedMtd: dto.samplesProcessedMtd ? Number(dto.samplesProcessedMtd) : 0,
          samplesRoutedMtd: dto.samplesRoutedMtd ? Number(dto.samplesRoutedMtd) : 0,
          avgTatHours: dto.avgTatHours ? Number(dto.avgTatHours) : null,
          tatBreachPct: dto.tatBreachPct ? Number(dto.tatBreachPct) : null,
          revenuesMtd: dto.revenuesMtd ? Number(dto.revenuesMtd) : null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.hubSpokeNode.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['nodeName', 'nodeCode', 'nodeType', 'parentHubId', 'address', 'city', 'state',
        'pincode', 'contactPerson', 'phone', 'nablCovered', 'nablAnnexureRef',
        'coldChainAvailable', 'runnerAssigned', 'operatingHours', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['latitude', 'longitude', 'dailyCapacity', 'currentUtilization',
        'transitTimeHours', 'staffCount', 'samplesProcessedMtd', 'samplesRoutedMtd',
        'avgTatHours', 'tatBreachPct', 'revenuesMtd'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testsAvailableLocally) updateData.testsAvailableLocally = dto.testsAvailableLocally;
      if (dto.testsRoutedToHub) updateData.testsRoutedToHub = dto.testsRoutedToHub;
      if (dto.routingRules) updateData.routingRules = dto.routingRules;
      if (dto.pickupSchedule) updateData.pickupSchedule = dto.pickupSchedule;
      if (dto.equipmentList) updateData.equipmentList = dto.equipmentList;
      return await this.prisma.hubSpokeNode.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType] = await Promise.all([
        this.prisma.hubSpokeNode.count({ where: { tenantId } }),
        this.prisma.hubSpokeNode.groupBy({ by: ['nodeType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byNodeType: byType.map(t => ({ type: t.nodeType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byNodeType: [] }; }
  }
}
