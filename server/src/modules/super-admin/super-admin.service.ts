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
      this.prisma.notification.findMany({
        where: { type: 'ANNOUNCEMENT' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }).catch(() => []),
      this.prisma.notification.count({ where: { type: 'ANNOUNCEMENT' } }).catch(() => 0),
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
    if (tenantId) where.tenantId = tenantId;
    try {
      const [data, total] = await Promise.all([
        this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit),
          include: { user: { select: { email: true, firstName: true, role: true } } } }),
        this.prisma.auditLog.count({ where }),
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
}
