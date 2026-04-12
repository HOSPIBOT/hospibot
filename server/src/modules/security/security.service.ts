import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

// ── RBAC Permission Definitions ─────────────────────────────────────────────

export const PERMISSIONS = {
  // Patient module
  'patients.view':   'View patient records',
  'patients.create': 'Register new patients',
  'patients.edit':   'Edit patient information',
  'patients.delete': 'Archive patients',
  'patients.export': 'Export patient data',

  // Appointments
  'appointments.view':   'View appointments',
  'appointments.create': 'Book appointments',
  'appointments.edit':   'Reschedule/Cancel appointments',

  // Billing
  'billing.view':    'View invoices',
  'billing.create':  'Create invoices',
  'billing.edit':    'Edit invoices',
  'billing.export':  'Export billing data',
  'billing.discount':'Apply discounts',

  // Doctors
  'doctors.view':   'View doctor profiles',
  'doctors.create': 'Add doctors',
  'doctors.edit':   'Edit doctor information',

  // WhatsApp
  'whatsapp.view': 'View WhatsApp inbox',
  'whatsapp.send': 'Send WhatsApp messages',

  // CRM
  'crm.view':       'View CRM leads',
  'crm.edit':       'Edit leads and stages',
  'crm.campaigns':  'Create/send campaigns',

  // Analytics
  'analytics.view':   'View analytics dashboard',
  'analytics.export': 'Export reports',

  // Settings
  'settings.view':   'View settings',
  'settings.edit':   'Change settings',

  // Automation
  'automation.view':   'View automation rules',
  'automation.edit':   'Create/edit automation rules',

  // Users
  'users.view':   'View user list',
  'users.create': 'Add team members',
  'users.edit':   'Edit user roles',
  'users.delete': 'Remove users',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: Object.keys(PERMISSIONS), // All permissions
  DOCTOR: ['patients.view', 'patients.edit', 'appointments.view', 'appointments.edit', 'billing.view', 'analytics.view', 'whatsapp.view'],
  RECEPTIONIST: ['patients.view', 'patients.create', 'appointments.view', 'appointments.create', 'appointments.edit', 'billing.view', 'whatsapp.view', 'whatsapp.send'],
  BILLING_STAFF: ['patients.view', 'billing.view', 'billing.create', 'billing.edit', 'billing.export', 'billing.discount'],
  MARKETING_USER: ['crm.view', 'crm.edit', 'crm.campaigns', 'analytics.view'],
  LAB_TECHNICIAN: ['patients.view', 'analytics.view'],
  PHARMACIST: ['patients.view', 'billing.view', 'analytics.view'],
  NURSE: ['patients.view', 'patients.edit', 'appointments.view', 'whatsapp.view'],
};

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private prisma: PrismaService) {}

  // ── Audit Logging ──────────────────────────────────────────────────────────

  async logAction(params: {
    tenantId: string; userId?: string; action: string; entity: string;
    entityId?: string; changes?: any; ipAddress?: string; userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId:  params.tenantId,
          userId:    params.userId,
          action:    params.action,
          entity:    params.entity,
          entityId:  params.entityId,
          changes:   params.changes,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Audit log failed: ${err}`);
    }
  }

  async getAuditLogs(tenantId: string, filters: any) {
    const { page = 1, limit = 50, entity, action, userId, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (entity)  where.entity = entity;
    if (action)  where.action = action;
    if (userId)  where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSuperAdminAuditLogs(filters: any) {
    const { page = 1, limit = 50, tenantId, action } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── User Management ────────────────────────────────────────────────────────

  async listUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, permissions: true, createdAt: true, lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(tenantId: string, userId: string, dto: { role: string; customPermissions?: string[] }) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new BadRequestException('User not found in this tenant');

    const rolePerms = ROLE_PERMISSIONS[dto.role] || [];
    const permissions = dto.customPermissions || rolePerms;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role as any,
        permissions: permissions.reduce((acc: any, p: string) => ({ ...acc, [p]: true }), {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, permissions: true },
    });
  }

  async deactivateUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { deactivated: true };
  }

  // ── MFA / OTP ──────────────────────────────────────────────────────────────

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOTP(userId: string, otp: string, purpose: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          otp: { hash, expiresAt: expiresAt.toISOString(), purpose },
        },
      },
    }).catch(() => {});
  }

  async verifyOTP(userId: string, otp: string, purpose: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const settings = user?.settings as any;
    const storedOTP = settings?.otp;

    if (!storedOTP) return false;
    if (storedOTP.purpose !== purpose) return false;
    if (new Date(storedOTP.expiresAt) < new Date()) return false;

    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    return hash === storedOTP.hash;
  }

  // ── Permission Checking ────────────────────────────────────────────────────

  hasPermission(user: any, permission: string): boolean {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;

    const permissions = user.permissions as Record<string, boolean>;
    if (permissions?.[permission] === true) return true;

    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    return rolePerms.includes(permission);
  }

  getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  getAllPermissions() {
    return Object.entries(PERMISSIONS).map(([key, description]) => ({ key, description }));
  }

  // ── Security Stats ─────────────────────────────────────────────────────────

  async getSecurityStats(tenantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, recentLogins, recentActions, roleBreakdown] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.auditLog.count({ where: { tenantId, action: 'LOGIN', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.auditLog.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { tenantId, isActive: true },
        _count: true,
      }),
    ]);

    return { totalUsers, recentLogins, recentActions, roleBreakdown };
  }

  // ── Data Export / Right to Erasure ────────────────────────────────────────

  async exportPatientData(tenantId: string, patientId: string) {
    const [patient, appointments, invoices, labOrders, prescriptions] = await Promise.all([
      this.prisma.patient.findFirst({ where: { id: patientId, tenantId, deletedAt: null } }),
      this.prisma.appointment.findMany({ where: { tenantId, patientId }, take: 100 }),
      this.prisma.invoice.findMany({ where: { tenantId, patientId }, take: 100 }),
      this.prisma.labOrder.findMany({ where: { tenantId, patientId }, take: 100 }),
      this.prisma.prescription.findMany({ where: { tenantId, patientId }, take: 100 }),
    ]);

    return { patient, appointments, invoices, labOrders, prescriptions, exportedAt: new Date().toISOString() };
  }

  async requestErasure(tenantId: string, patientId: string, requestedBy: string) {
    // Soft delete — mark patient as deleted, anonymize PII
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId, deletedAt: null } });
    if (!patient) throw new BadRequestException('Patient not found');

    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        deletedAt: new Date(),
        firstName: '[ERASED]',
        lastName: '[ERASED]',
        phone: `ERASED-${Date.now()}`,
        email: null,
        address: null,
        notes: null,
      },
    });

    await this.logAction({
      tenantId, userId: requestedBy, action: 'ERASURE_REQUEST',
      entity: 'patient', entityId: patientId,
      changes: { reason: 'DPDPA Right to Erasure requested' },
    });

    return { erased: true, message: 'Patient data anonymised in compliance with DPDPA' };
  }
}
