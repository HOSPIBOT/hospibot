import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateTenantStatusDto,
  UpdateTenantPlanDto,
  CreateAnnouncementDto,
  PlatformSettingsDto,
  TenantStatusAction,
} from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Platform Analytics ───────────────────────────────────────────────────

  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalUsers,
      totalPatients,
      totalAppointments,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count(),
      this.prisma.patient.count(),
      this.prisma.appointment.count(),
    ]);

    // Plan distribution
    const planDistribution = await this.prisma.tenant.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });

    // Type distribution
    const typeDistribution = await this.prisma.tenant.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    // Tenants created per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTenants = await this.prisma.tenant.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, plan: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      tenants: { total: totalTenants, active: activeTenants, trial: trialTenants, suspended: suspendedTenants },
      users: totalUsers,
      patients: totalPatients,
      appointments: totalAppointments,
      planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count.plan })),
      typeDistribution: typeDistribution.map(t => ({ type: t.type, count: t._count.type })),
      recentOnboarding: recentTenants,
    };
  }

  // ─── Tenant Management ────────────────────────────────────────────────────

  async getAllTenants(page = 1, limit = 20, search?: string, status?: string, plan?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true, branches: true, patients: true, appointments: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: { users: true, patients: true, appointments: true, invoices: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async updateTenantStatus(tenantId: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const statusMap: Record<TenantStatusAction, string> = {
      [TenantStatusAction.ACTIVATE]: 'ACTIVE',
      [TenantStatusAction.SUSPEND]: 'SUSPENDED',
      [TenantStatusAction.CANCEL]: 'CANCELLED',
    };

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: statusMap[dto.action] as any },
    });
  }

  async updateTenantPlan(tenantId: string, dto: UpdateTenantPlanDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: dto.plan as any },
    });
  }

  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Cascade delete is handled by Prisma schema relations
    await this.prisma.tenant.delete({ where: { id: tenantId } });
    return { message: `Tenant ${tenant.name} permanently deleted` };
  }

  // ─── Users (platform-wide) ────────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, search?: string, role?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.isActive = status === 'ACTIVE';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true, slug: true, plan: true, city: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => ({ ...u, passwordHash: undefined })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Announcements ────────────────────────────────────────────────────────


  async getAnnouncements(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }).catch(() => []),
      this.prisma.announcement.count().catch(() => 0),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createAnnouncement(dto: CreateAnnouncementDto, adminId: string) {
    // Determine target tenants based on audience
    let tenantWhere: any = {};
    const [audienceType, audienceValue] = (dto.audience || 'ALL').split(':');

    if (audienceType === 'PLAN' && audienceValue) {
      tenantWhere.plan = audienceValue.trim();
    } else if (audienceType === 'STATUS' && audienceValue) {
      tenantWhere.status = audienceValue.trim();
    }

    const targetTenants = await this.prisma.tenant.findMany({
      where: tenantWhere,
      select: { id: true },
    });

    // Announcements stored as platform notifications (using the existing Notification model)
    // In a real implementation, you'd have a separate Announcements table
    // For now, we return a mock response
    return {
      id: `ann_${Date.now()}`,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      audience: dto.audience || 'ALL',
      sentTo: targetTenants.length,
      sentAt: dto.scheduledAt || new Date(),
      createdBy: adminId,
    };
  }

  // ─── Platform Settings ────────────────────────────────────────────────────


  async getAuditLogs({ page = 1, limit = 50, action, tenantId }: { page?: number; limit?: number; action?: string; tenantId?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    // AuditLog.tenantId is required (non-nullable) — only filter if a specific tenantId is provided
    // SUPER_ADMIN passes no tenantId → returns all logs across all tenants
    if (tenantId) where.tenantId = tenantId;
    try {
      const [data, total] = await Promise.all([
        this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
        this.prisma.auditLog.count(where && Object.keys(where).length > 0 ? { where } : undefined),
      ]);
      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } catch {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  async getPlatformSettings() {
    // In production, these would be stored in a PlatformConfig table
    // For now, return environment-based defaults
    return {
      trialDays: 14,
      autoSuspendAfterDays: 3,
      allowNewRegistrations: true,
      requireEmailVerification: true,
      maintenanceMode: false,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@hospibot.ai',
      alertEmailRecipients: process.env.ALERT_EMAILS || 'ops@hospibot.ai',
      invoicePrefix: 'HB',
    };
  }

  async updatePlatformSettings(dto: PlatformSettingsDto) {
    // In production: upsert into a PlatformConfig table
    // For now, we acknowledge the update
    return { updated: true, settings: dto };
  }

  // ─── System Health ────────────────────────────────────────────────────────

  async getSystemHealth() {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    const [tenantCount, userCount, patientCount] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.patient.count(),
    ]);

    return {
      status: 'operational',
      timestamp: new Date(),
      database: {
        status: 'operational',
        latencyMs: dbLatency,
      },
      platform: {
        tenants: tenantCount,
        users: userCount,
        patients: patientCount,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    };
  }

  // ── Diagnostic Wallet Management (Super Admin) ──────────────────────────────

  async getTenantWalletOverview(tenantId: string) {
    const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
    const [recentTxns, usageLogs] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }, take: 20,
      }),
      this.prisma.messageUsageLog.aggregate({
        where: { tenantId, sentAt: { gte: new Date(new Date().setDate(1)) } },
        _sum: { creditsCharged: true },
        _count: true,
      }),
    ]);
    return { wallet, recentTxns, thisMonthMessages: usageLogs._count, thisMonthCredits: usageLogs._sum.creditsCharged ?? 0 };
  }

  async adminCreditWallet(tenantId: string, walletType: string, amount: number, reason: string, adminId: string) {
    let wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
    if (!wallet) wallet = await this.prisma.tenantWallet.create({ data: { tenantId } });

    const updateData: any = {};
    let before = 0;
    if (walletType === 'WHATSAPP') { before = wallet.waCredits; updateData.waCredits = { increment: amount }; }
    else if (walletType === 'SMS') { before = wallet.smsCredits; updateData.smsCredits = { increment: amount }; }
    else if (walletType === 'STORAGE') { before = wallet.storageGbPurchased; updateData.storageGbPurchased = { increment: amount }; }

    await this.prisma.tenantWallet.update({ where: { tenantId }, data: updateData });
    await this.prisma.walletTransaction.create({
      data: {
        tenantId, walletId: wallet.id,
        walletType: walletType as any, txType: 'CREDIT_TOPUP',
        amount, balanceBefore: before, balanceAfter: before + amount,
        referenceType: 'admin_credit', referenceId: adminId,
        description: `Admin credit: ${reason}`,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId, tenantId: 'PLATFORM',
        action: 'ADMIN_WALLET_CREDIT',
        entity: 'TenantWallet',
        entityId: tenantId,
        changes: { walletType, amount, reason },
      },
    }).catch(() => {});

    return { success: true, credited: amount, walletType };
  }

  async getAllWalletStats() {
    const tenants = await this.prisma.tenantWallet.findMany({
      orderBy: { waCredits: 'asc' }, // low balance first
      take: 50,
    });
    const lowBalance = tenants.filter(w => w.waCredits < 100);
    const totalWaCredits = tenants.reduce((s, w) => s + w.waCredits, 0);
    return { tenants, lowBalance: lowBalance.length, totalWaCredits };
  }

  // ─── Tier Upgrade Requests ────────────────────────────────────────────────

  /**
   * List all upgrade requests across all tenants.
   * Requests are stored in tenant.settings.upgradeRequests[] — we iterate
   * and flatten, attaching tenant identity to each request for display.
   */
  async listUpgradeRequests(status: string = 'pending') {
    // Only pull tenants that have at least something in upgradeRequests.
    // Can't do a JSON contains filter portably, so fetch tenants that have
    // any settings and filter in memory. For larger scale, introduce a
    // dedicated UpgradeRequest table.
    const tenants = await this.prisma.tenant.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        id: true, name: true, slug: true, settings: true,
        portalFamily: { select: { name: true, slug: true } },
        subType:      { select: { name: true, slug: true } },
      },
    });

    const flat: any[] = [];
    for (const t of tenants) {
      const settings = (t.settings ?? {}) as Record<string, any>;
      const requests = Array.isArray(settings.upgradeRequests) ? settings.upgradeRequests : [];
      for (const r of requests) {
        if (status === 'all' || r.status === status) {
          flat.push({
            ...r,
            tenantId: t.id,
            tenantName: t.name,
            tenantSlug: t.slug,
            portalFamily: t.portalFamily?.name ?? null,
            subType: t.subType?.name ?? null,
          });
        }
      }
    }
    // Sort newest first
    flat.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    return flat;
  }

  /**
   * Approve or reject a tenant upgrade request.
   * If approved, also updates tenant.settings.labTier to the target tier.
   * Writes an audit log entry tagged with the reviewing admin.
   */
  async updateUpgradeRequest(
    tenantId: string,
    requestId: string,
    dto: { status: 'approved' | 'rejected'; note?: string },
    adminId: string,
  ) {
    if (!['approved', 'rejected'].includes(dto.status)) {
      throw new BadRequestException('Status must be approved or rejected');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const settings = (tenant.settings ?? {}) as Record<string, any>;
    const requests = Array.isArray(settings.upgradeRequests) ? [...settings.upgradeRequests] : [];
    const idx = requests.findIndex((r: any) => r.id === requestId);
    if (idx < 0) throw new NotFoundException('Upgrade request not found');

    const prevRequest = requests[idx];
    if (prevRequest.status !== 'pending') {
      throw new BadRequestException(
        `Request already ${prevRequest.status}. Cannot re-review.`,
      );
    }

    // Update the request entry
    requests[idx] = {
      ...prevRequest,
      status: dto.status,
      adminNote: dto.note || null,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
    };

    // Build new settings — if approved, also switch the active labTier
    const newSettings = {
      ...settings,
      upgradeRequests: requests,
      ...(dto.status === 'approved' ? { labTier: prevRequest.targetTier } : {}),
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: newSettings },
    });

    // Audit trail
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: adminId,
        action: 'UPGRADE_REQUEST_REVIEW',
        entity: 'Tenant',
        entityId: tenantId,
        changes: {
          requestId,
          fromTier: prevRequest.fromTier,
          targetTier: prevRequest.targetTier,
          decision: dto.status,
          note: dto.note || null,
        },
      },
    }).catch(() => {});

    return { success: true, request: requests[idx] };
  }


// ── Gateway Charges & Subscription Tracking ──────────────────────────────

  async getGatewayChargesConfig() {
    const tenant = await this.prisma.tenant.findFirst({ where: { slug: 'platform-config' } }).catch(() => null);
    const settings: any = (tenant?.settings as any) || {};
    return {
      razorpayFeePercent: settings.razorpayFeePercent ?? 2.36,  // Razorpay charges 2% + GST on 2% = 2.36%
      gstPercent: settings.gstPercent ?? 18,
      gatewayFeeLabel: settings.gatewayFeeLabel || 'Payment Gateway Charges',
      gstLabel: settings.gstLabel || 'GST @18%',
      autoDisableAfterDays: settings.autoDisableAfterDays ?? 7,
      reminderDays: settings.reminderDays ?? [15, 10, 5, 3, 1],
      perChannelGatewayFees: settings.perChannelGatewayFees ?? {
        subscription: { razorpayFeePercent: 2.36, label: 'Subscription Payment' },
        whatsapp_topup: { razorpayFeePercent: 2.36, label: 'WhatsApp Recharge' },
        sms_topup: { razorpayFeePercent: 2.36, label: 'SMS Recharge' },
        storage_topup: { razorpayFeePercent: 2.36, label: 'Storage Recharge' },
      },
    };
  }

  async updateGatewayChargesConfig(dto: any, adminId: string) {
    // Store in platform-config tenant settings (or create one)
    let platform = await this.prisma.tenant.findFirst({ where: { slug: 'platform-config' } }).catch(() => null);
    if (!platform) {
      platform = await this.prisma.tenant.create({
        data: { name: 'Platform Config', slug: 'platform-config', type: 'DIAGNOSTIC' as any,
          email: 'admin@hospibot.in', phone: '0000000000', settings: {} as any },
      });
    }
    const s: any = (platform.settings as any) || {};
    if (dto.razorpayFeePercent !== undefined) s.razorpayFeePercent = Number(dto.razorpayFeePercent);
    if (dto.gstPercent !== undefined) s.gstPercent = Number(dto.gstPercent);
    if (dto.autoDisableAfterDays !== undefined) s.autoDisableAfterDays = Number(dto.autoDisableAfterDays);
    if (dto.reminderDays !== undefined) s.reminderDays = dto.reminderDays;
    if (dto.perChannelGatewayFees !== undefined) s.perChannelGatewayFees = dto.perChannelGatewayFees;
    await this.prisma.tenant.update({ where: { id: platform.id }, data: { settings: s as any } });
    return this.getGatewayChargesConfig();
  }

  /** Get subscription renewal tracker — who's due, overdue, expiring soon */
  async getSubscriptionTracker() {
    const now = new Date();
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, plan: true, status: true, email: true, phone: true,
        settings: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const config = await this.getGatewayChargesConfig();
    const autoDisableDays = config.autoDisableAfterDays || 7;

    const tracker = {
      totalTenants: tenants.length,
      active: 0, trial: 0, expired: 0, suspended: 0, cancelled: 0,
      renewalIn15Days: [] as any[], renewalIn10Days: [] as any[], renewalIn5Days: [] as any[],
      overdue: [] as any[], overdueAutoDisable: [] as any[],
      lowFunds: [] as any[],
    };

    for (const t of tenants) {
      const s: any = (t.settings as any) || {};
      const periodEnd = s.currentPeriodEnd ? new Date(s.currentPeriodEnd) : null;
      const status = String(t.status);

      if (status === 'ACTIVE') tracker.active++;
      else if (status === 'TRIAL') tracker.trial++;
      else if (status === 'EXPIRED') tracker.expired++;
      else if (status === 'SUSPENDED') tracker.suspended++;
      else if (status === 'CANCELLED') tracker.cancelled++;

      if (!periodEnd) continue;

      const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const tenantSummary = { id: t.id, name: t.name, slug: t.slug, plan: t.plan, status,
        email: t.email, phone: t.phone, periodEnd: periodEnd.toISOString(),
        daysUntilRenewal, razorpayStatus: s.razorpayStatus || null };

      if (daysUntilRenewal < 0) {
        // Overdue
        const daysOverdue = Math.abs(daysUntilRenewal);
        tracker.overdue.push({ ...tenantSummary, daysOverdue });
        if (daysOverdue >= autoDisableDays) {
          tracker.overdueAutoDisable.push({ ...tenantSummary, daysOverdue });
        }
      } else if (daysUntilRenewal <= 5) tracker.renewalIn5Days.push(tenantSummary);
      else if (daysUntilRenewal <= 10) tracker.renewalIn10Days.push(tenantSummary);
      else if (daysUntilRenewal <= 15) tracker.renewalIn15Days.push(tenantSummary);
    }

    // Check low wallet balance
    const wallets = await this.prisma.tenantWallet.findMany({
      where: { OR: [{ waCredits: { lt: 100 } }, { smsCredits: { lt: 50 } }] },
    });
    for (const w of wallets) {
      const t = tenants.find(t => t.id === w.tenantId);
      if (t) tracker.lowFunds.push({ id: t.id, name: t.name, waCredits: w.waCredits, smsCredits: w.smsCredits });
    }

    return tracker;
  }

  /** Auto-disable tenants overdue by more than X days */
  async autoDisableOverdueTenants() {
    const config = await this.getGatewayChargesConfig();
    const cutoff = new Date(Date.now() - config.autoDisableAfterDays * 24 * 60 * 60 * 1000);
    
    const tenants = await this.prisma.tenant.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] as any[] } },
      select: { id: true, settings: true, status: true },
    });

    let disabled = 0;
    for (const t of tenants) {
      const s: any = (t.settings as any) || {};
      const periodEnd = s.currentPeriodEnd ? new Date(s.currentPeriodEnd) : null;
      if (periodEnd && periodEnd < cutoff) {
        await this.prisma.tenant.update({ where: { id: t.id }, data: { status: 'SUSPENDED' } });
        disabled++;
      }
    }
    return { disabled, checkedAt: new Date().toISOString() };
  }
}
