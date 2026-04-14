import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  // ── Portal Families ────────────────────────────────────────────────────────

  async getAllFamilies(includeInactive = false) {
    try {
      return await this.prisma.portalFamily.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: { theme: true, _count: { select: { subTypes: true, tenants: true } } },
        orderBy: { sortOrder: 'asc' },
      });
    } catch (err: any) {
      // Gracefully handle missing columns/tables during migration
      // Try simpler query without relations
      try {
        return await this.prisma.portalFamily.findMany({
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      } catch {
        return [];
      }
    }
  }

  async getFamilyBySlug(slug: string) {
    const family = await this.prisma.portalFamily.findUnique({
      where: { slug },
      include: {
        theme: true,
        subTypes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!family) throw new NotFoundException(`Portal family '${slug}' not found`);
    return family;
  }

  async createFamily(data: any) {
    return this.prisma.portalFamily.create({ data, include: { theme: true } });
  }

  async updateFamily(id: string, data: any) {
    return this.prisma.portalFamily.update({ where: { id }, data, include: { theme: true } });
  }

  async toggleFamily(id: string, isActive: boolean) {
    return this.prisma.portalFamily.update({ where: { id }, data: { isActive } });
  }

  // ── Sub-types ──────────────────────────────────────────────────────────────

  async getSubTypesByFamily(portalFamilyId: string, includeInactive = false) {
    return this.prisma.tenantSubType.findMany({
      where: { portalFamilyId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getSubTypeBySlug(portalFamilySlug: string, subTypeSlug: string) {
    const family = await this.prisma.portalFamily.findUnique({ where: { slug: portalFamilySlug } });
    if (!family) throw new NotFoundException('Portal family not found');
    const subType = await this.prisma.tenantSubType.findUnique({
      where: { portalFamilyId_slug: { portalFamilyId: family.id, slug: subTypeSlug } },
    });
    if (!subType) throw new NotFoundException('Sub-type not found');
    return subType;
  }

  async createSubType(data: any) {
    return this.prisma.tenantSubType.create({ data });
  }

  async updateSubType(id: string, data: any) {
    return this.prisma.tenantSubType.update({ where: { id }, data });
  }

  async updateSubTypeFeatureFlags(id: string, featureFlags: Record<string, boolean>) {
    return this.prisma.tenantSubType.update({ where: { id }, data: { featureFlags } });
  }

  async toggleSubType(id: string, isActive: boolean) {
    return this.prisma.tenantSubType.update({ where: { id }, data: { isActive } });
  }

  // ── Portal Themes ──────────────────────────────────────────────────────────

  async getTheme(portalFamilyId: string) {
    return this.prisma.portalTheme.findUnique({ where: { portalFamilyId } });
  }

  async getThemeBySlug(slug: string) {
    const family = await this.prisma.portalFamily.findUnique({
      where: { slug },
      include: { theme: true },
    });
    return family?.theme ?? null;
  }

  async updateTheme(portalFamilyId: string, colors: any, updatedBy: string) {
    return this.prisma.portalTheme.upsert({
      where: { portalFamilyId },
      create: { portalFamilyId, ...colors, updatedBy },
      update: { ...colors, updatedBy },
    });
  }

  // ── Platform Assets (logo, tagline) ───────────────────────────────────────


  async getAllSubTypes(familyId?: string) {
    try {
      return await this.prisma.tenantSubType.findMany({
        where: familyId ? { portalFamilyId: familyId } : {},
        include: { portalFamily: { select: { id: true, name: true, slug: true } } },
        orderBy: { portalFamilyId: 'asc' },
      });
    } catch {
      return [];
    }
  }

  async getAllThemes() {
    try {
      return await this.prisma.portalTheme.findMany({
        include: { portalFamily: { select: { id: true, name: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    } catch {
      return [];
    }
  }

  async getPlatformAssets() {
    return this.prisma.platformAsset.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', logoUrl: '/hospibot-logo.png', tagline: 'Connect 24*7...' },
      update: {},
    });
  }

  async updatePlatformAssets(data: { logoUrl?: string; logoAlt?: string; faviconUrl?: string; tagline?: string }, updatedBy: string) {
    return this.prisma.platformAsset.update({
      where: { id: 'singleton' },
      data: { ...data, updatedBy },
    });
  }

  // ── Registration helpers ───────────────────────────────────────────────────

  /** Returns everything the registration wizard needs in one call */
  async getRegistrationContext() {
    const families = await this.prisma.portalFamily.findMany({
      where: { isActive: true },
      include: {
        theme: true,
        subTypes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    const assets = await this.getPlatformAssets();
    return { families, assets };
  }
}
