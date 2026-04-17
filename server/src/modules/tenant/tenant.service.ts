import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        portalFamily: { select: { id: true, name: true, slug: true, icon: true } },
        subType: { select: { id: true, name: true, slug: true, featureFlags: true } },
      },
    }).catch(() => this.prisma.tenant.findUnique({ where: { id } }));
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }


  async createBranch(tenantId: string, dto: any) {
    return this.prisma.branch.create({
      data: {
        tenantId,
        name:     dto.name,
        address:  dto.address,
        city:     dto.city,
        state:    dto.state,
        pincode:  dto.pincode,
        phone:    dto.phone,
        email:    dto.email,
        isActive: true,
        // isMain removed - not in schema
      },
    });
  }

  async updateBranch(tenantId: string, branchId: string, dto: any) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  async updateSettings(tenantId: string, settings: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
  }

  async getBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }




  async update(tenantId: string, dto: any): Promise<any> {
    const allowed = [
      'name', 'phone', 'email', 'website', 'address', 'city',
      'state', 'pincode', 'gstNumber', 'logoUrl', 'settings',
    ];
    const data: any = {};
    for (const key of allowed) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }

  /**
   * Queue an upgrade request for billing team follow-up.
   * Stored in tenant.settings.upgradeRequests[] to avoid a schema migration.
   * In production, this would trigger an email to sales/billing.
   */
  async requestUpgrade(
    tenantId: string,
    dto: { targetTier: string; note?: string },
  ): Promise<{ success: boolean; request: any }> {
    const validTiers = ['small', 'medium', 'large', 'enterprise'];
    if (!dto.targetTier || !validTiers.includes(dto.targetTier)) {
      throw new BadRequestException('Invalid target tier. Must be one of: small, medium, large, enterprise');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const settings = (tenant.settings ?? {}) as Record<string, any>;
    const currentTier = settings.labTier || 'small';
    const existing = Array.isArray(settings.upgradeRequests) ? settings.upgradeRequests : [];

    // Prevent duplicate pending requests for same target
    const alreadyPending = existing.some(
      (r: any) => r.targetTier === dto.targetTier && r.status === 'pending',
    );
    if (alreadyPending) {
      throw new BadRequestException(
        `An upgrade request to ${dto.targetTier} is already pending. Our team will contact you shortly.`,
      );
    }

    const newRequest = {
      id: `upreq_${Date.now()}`,
      fromTier: currentTier,
      targetTier: dto.targetTier,
      note: dto.note || null,
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          upgradeRequests: [...existing, newRequest],
        },
      },
    });

    return { success: true, request: newRequest };
  }

  async listUpgradeRequests(tenantId: string): Promise<any[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant) return [];
    const settings = (tenant.settings ?? {}) as Record<string, any>;
    return Array.isArray(settings.upgradeRequests) ? settings.upgradeRequests : [];
  }
}