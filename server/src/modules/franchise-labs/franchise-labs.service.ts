import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Franchise lab management (DLPL/Metropolis/SRL model)
// Types: Collection Center (₹3-4L) / Diagnostic Center
// Revenue sharing: 25-30% commission
// Brand compliance scoring, onboarding workflow, regular audits

@Injectable()
export class FranchiseLabsService {
  private readonly logger = new Logger(FranchiseLabsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, franchiseType, status, search } = query;
      const where: any = { tenantId };
      if (franchiseType) where.franchiseType = franchiseType;
      if (status) where.status = status;
      if (search) { where.OR = [{ franchiseName: { contains: search, mode: 'insensitive' } }, { ownerName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.franchiseLab.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.franchiseLab.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.franchiseLab.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.franchiseName) throw new BadRequestException('Franchise name required');
      if (!dto.franchiseType) throw new BadRequestException('Type required (collection-center/diagnostic-center/pickup-point)');
      return await this.prisma.franchiseLab.create({
        data: {
          tenantId, franchiseName: dto.franchiseName, franchiseCode: dto.franchiseCode || null,
          franchiseType: dto.franchiseType,
          // Owner
          ownerName: dto.ownerName || null, ownerPhone: dto.ownerPhone || null,
          ownerEmail: dto.ownerEmail || null, ownerAadhaar: dto.ownerAadhaar || null,
          ownerPan: dto.ownerPan || null,
          // Location
          address: dto.address || null, city: dto.city || null, state: dto.state || null,
          pincode: dto.pincode || null, areaSqFt: dto.areaSqFt ? Number(dto.areaSqFt) : null,
          floorLevel: dto.floorLevel || null,
          // Agreement
          agreementDate: dto.agreementDate ? new Date(dto.agreementDate) : null,
          agreementExpiry: dto.agreementExpiry ? new Date(dto.agreementExpiry) : null,
          agreementDurationYears: dto.agreementDurationYears ? Number(dto.agreementDurationYears) : null,
          securityDeposit: dto.securityDeposit ? Number(dto.securityDeposit) : null,
          franchiseFee: dto.franchiseFee ? Number(dto.franchiseFee) : null,
          // Revenue sharing
          revSharePct: dto.revSharePct ? Number(dto.revSharePct) : null,
          revShareModel: dto.revShareModel || null,
          monthlyMinGuarantee: dto.monthlyMinGuarantee ? Number(dto.monthlyMinGuarantee) : null,
          // Onboarding
          onboardingStage: dto.onboardingStage || 'application',
          siteApproved: dto.siteApproved || false,
          setupComplete: dto.setupComplete || false,
          staffTrained: dto.staffTrained || false,
          trialRunDone: dto.trialRunDone || false,
          launchDate: dto.launchDate ? new Date(dto.launchDate) : null,
          // Compliance
          brandComplianceScore: dto.brandComplianceScore ? Number(dto.brandComplianceScore) : null,
          lastAuditDate: dto.lastAuditDate ? new Date(dto.lastAuditDate) : null,
          lastAuditScore: dto.lastAuditScore ? Number(dto.lastAuditScore) : null,
          auditFindings: dto.auditFindings || null,
          sopAdherence: dto.sopAdherence || null,
          // Performance
          monthlyRevenue: dto.monthlyRevenue ? Number(dto.monthlyRevenue) : null,
          monthlySamples: dto.monthlySamples ? Number(dto.monthlySamples) : null,
          avgDailyFootfall: dto.avgDailyFootfall ? Number(dto.avgDailyFootfall) : null,
          customerRating: dto.customerRating ? Number(dto.customerRating) : null,
          notes: dto.notes || null, status: dto.status || 'onboarding',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.franchiseLab.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['franchiseName', 'franchiseCode', 'franchiseType', 'ownerName', 'ownerPhone',
        'ownerEmail', 'address', 'city', 'state', 'pincode', 'floorLevel', 'revShareModel',
        'onboardingStage', 'siteApproved', 'setupComplete', 'staffTrained', 'trialRunDone',
        'sopAdherence', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['areaSqFt', 'agreementDurationYears', 'securityDeposit', 'franchiseFee',
        'revSharePct', 'monthlyMinGuarantee', 'brandComplianceScore', 'lastAuditScore',
        'monthlyRevenue', 'monthlySamples', 'avgDailyFootfall', 'customerRating'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['agreementDate', 'agreementExpiry', 'launchDate', 'lastAuditDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.auditFindings) updateData.auditFindings = dto.auditFindings;
      return await this.prisma.franchiseLab.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, byStage] = await Promise.all([
        this.prisma.franchiseLab.count({ where: { tenantId } }),
        this.prisma.franchiseLab.groupBy({ by: ['franchiseType'], where: { tenantId }, _count: true }),
        this.prisma.franchiseLab.groupBy({ by: ['onboardingStage'], where: { tenantId }, _count: true }),
      ]);
      return { total, byType: byType.map(t => ({ type: t.franchiseType, count: t._count })), byStage: byStage.map(s => ({ stage: s.onboardingStage, count: s._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [], byStage: [] }; }
  }
}
