import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CreateLeadDto, UpdateLeadDto, ListLeadsDto, CreateCampaignDto, ListCampaignsDto } from './dto/crm.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ==========================================
  // LEAD MANAGEMENT
  // ==========================================

  async createLead(tenantId: string, dto: CreateLeadDto) {
    const existing = await this.prisma.lead.findFirst({
      where: { tenantId, phone: dto.phone, stage: { not: 'LOST' } },
    });
    if (existing) {
      throw new ConflictException(`Active lead with phone ${dto.phone} already exists`);
    }

    // Check if phone matches an existing patient
    const patient = await this.prisma.patient.findFirst({
      where: { tenantId, phone: { contains: dto.phone.slice(-10) }, deletedAt: null },
    });

    return this.prisma.lead.create({
      data: {
        tenantId,
        patientId: patient?.id || null,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        stage: 'NEW',
        campaignId: dto.campaignId,
        tags: dto.tags || [],
        notes: dto.notes,
        assignedTo: dto.assignedTo,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, healthId: true, lastVisitAt: true } },
        campaign: { select: { id: true, name: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async list(tenantId: string, query: ListLeadsDto) {
    const { page = 1, limit = 20, search, stage, source, assignedTo, tag } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (stage) where.stage = stage;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          campaign: { select: { name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateLead(tenantId: string, id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const data: any = { ...dto };

    // If converting to ACTIVE_PATIENT, set conversion timestamp
    if (dto.stage === 'ACTIVE_PATIENT' && lead.stage !== 'ACTIVE_PATIENT') {
      data.convertedAt = new Date();
    }
    if (dto.stage === 'LOST') {
      data.lostReason = dto.lostReason || 'Not specified';
    }
    data.lastContactAt = new Date();

    return this.prisma.lead.update({ where: { id }, data });
  }

  /**
   * Convert a lead to a patient (if not already linked)
   */
  async convertToPatient(tenantId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id: leadId, tenantId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.patientId) {
      return { message: 'Lead is already linked to a patient', patientId: lead.patientId };
    }

    // Create patient from lead data
    const nameParts = (lead.name || 'Unknown').split(' ');
    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || undefined,
        phone: lead.phone,
        email: lead.email,
        tags: lead.tags,
        healthId: `HB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    });

    // Link lead to patient and mark as converted
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { patientId: patient.id, stage: 'ACTIVE_PATIENT', convertedAt: new Date() },
    });

    return { message: 'Lead converted to patient', patientId: patient.id, patient };
  }

  /**
   * Lead funnel statistics
   */
  async getFunnelStats(tenantId: string) {
    const stages = ['NEW', 'CONTACTED', 'APPOINTMENT_BOOKED', 'VISITED', 'FOLLOW_UP_PENDING', 'ACTIVE_PATIENT', 'DORMANT', 'LOST'];

    const counts = await Promise.all(
      stages.map(async (stage) => ({
        stage,
        count: await this.prisma.lead.count({ where: { tenantId, stage: stage as any } }),
      })),
    );

    const total = counts.reduce((sum, c) => sum + c.count, 0);
    const converted = counts.find(c => c.stage === 'ACTIVE_PATIENT')?.count || 0;
    const lost = counts.find(c => c.stage === 'LOST')?.count || 0;

    // Source breakdown
    const sourceBreakdown = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId },
      _count: true,
    });

    return {
      funnel: counts,
      total,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      lostRate: total > 0 ? Math.round((lost / total) * 100) : 0,
      sourceBreakdown: sourceBreakdown.map(s => ({ source: s.source, count: s._count })),
    };
  }

  // ==========================================
  // CAMPAIGN MANAGEMENT
  // ==========================================

  async createCampaign(tenantId: string, dto: CreateCampaignDto) {
    // Count target patients matching filters
    const targetCount = await this.countTargetPatients(tenantId, dto.filters);

    return this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name,
        templateName: dto.templateName,
        filters: dto.filters,
        targetCount,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt ? 'scheduled' : 'draft',
      },
    });
  }

  async listCampaigns(tenantId: string, query: ListCampaignsDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { leads: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCampaignById(tenantId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { leads: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  /**
   * Execute a campaign - send WhatsApp messages to matching patients
   */
  async executeCampaign(tenantId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, tenantId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status === 'completed') throw new ConflictException('Campaign already executed');

    // Mark as executing
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'executing', executedAt: new Date() },
    });

    // Get target patients
    const patients = await this.getTargetPatients(tenantId, campaign.filters as any);

    let sentCount = 0;
    for (const patient of patients) {
      try {
        await this.whatsappService.sendTemplateMessage(
          tenantId, patient.phone, campaign.templateName,
        );
        sentCount++;
      } catch (err) {
        this.logger.error(`Campaign ${campaignId}: Failed to send to ${patient.phone}`);
      }
    }

    // Update campaign stats
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        sentCount,
        targetCount: patients.length,
      },
    });

    return { campaignId, targetCount: patients.length, sentCount };
  }

  // ==========================================
  // PATIENT SEGMENTATION
  // ==========================================

  /**
   * Count patients matching filter criteria
   */
  private async countTargetPatients(tenantId: string, filters: Record<string, any>): Promise<number> {
    const where = this.buildPatientFilter(tenantId, filters);
    return this.prisma.patient.count({ where });
  }

  /**
   * Get patients matching filter criteria
   */
  private async getTargetPatients(tenantId: string, filters: Record<string, any>) {
    const where = this.buildPatientFilter(tenantId, filters);
    return this.prisma.patient.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  }

  /**
   * Build Prisma where clause from campaign filters
   */
  private buildPatientFilter(tenantId: string, filters: Record<string, any>): any {
    const where: any = { tenantId, deletedAt: null };

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }
    if (filters.gender) {
      where.gender = filters.gender;
    }
    if (filters.bloodGroup) {
      where.bloodGroup = filters.bloodGroup;
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.chronicCondition) {
      where.chronicConditions = { has: filters.chronicCondition };
    }
    if (filters.lastVisitBefore) {
      where.lastVisitAt = { lt: new Date(filters.lastVisitBefore) };
    }
    if (filters.lastVisitAfter) {
      where.lastVisitAt = { gte: new Date(filters.lastVisitAfter) };
    }
    if (filters.noVisitSinceDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.noVisitSinceDays);
      where.OR = [
        { lastVisitAt: { lt: cutoff } },
        { lastVisitAt: null },
      ];
    }
    if (filters.ageMin || filters.ageMax) {
      where.dateOfBirth = {};
      if (filters.ageMax) {
        const minDob = new Date();
        minDob.setFullYear(minDob.getFullYear() - filters.ageMax);
        where.dateOfBirth.gte = minDob;
      }
      if (filters.ageMin) {
        const maxDob = new Date();
        maxDob.setFullYear(maxDob.getFullYear() - filters.ageMin);
        where.dateOfBirth.lte = maxDob;
      }
    }

    return where;
  }
}

  async estimateCampaignReach(tenantId: string, filters: Record<string, any>): Promise<number> {
    return this.countTargetPatients(tenantId, filters);
  }
