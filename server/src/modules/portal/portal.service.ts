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

  // ── Subtype Groups (for group-picker step in registration) ────────────────

  async getGroupsByFamily(familySlug: string) {
    const family = await this.prisma.portalFamily.findUnique({ where: { slug: familySlug } });
    if (!family) throw new NotFoundException(`Portal family '${familySlug}' not found`);
    try {
      const groups = await (this.prisma as any).subtypeGroup.findMany({
        where: { portalFamilyId: family.id, isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      // Enrich each group with a live count of active subtypes inside it.
      // Cast the client to `any` before calling groupBy — Prisma's generic
      // signature triggers a TS2615 circular-mapped-type evaluation when
      // applied to tenantSubType with its 17+ scalar fields. At runtime
      // this is still a real groupBy call.
      const prismaAny = this.prisma as any;
      const counts: Array<{ groupSlug: string | null; _count: { _all: number } }> =
        await prismaAny.tenantSubType.groupBy({
          by: ['groupSlug'],
          where: { portalFamilyId: family.id, isActive: true },
          _count: { _all: true },
        }).catch(() => [] as any[]);
      const countMap: Record<string, number> = {};
      for (const c of counts) {
        if (c.groupSlug) countMap[c.groupSlug] = c._count?._all ?? 0;
      }
      return groups.map((g: any) => ({ ...g, subtypeCount: countMap[g.slug] ?? 0 }));
    } catch {
      // Table may not exist yet during schema migration — return empty list
      return [];
    }
  }

  async getSubtypesByGroup(familySlug: string, groupSlug: string) {
    const family = await this.prisma.portalFamily.findUnique({ where: { slug: familySlug } });
    if (!family) throw new NotFoundException(`Portal family '${familySlug}' not found`);
    try {
      return await this.prisma.tenantSubType.findMany({
        where: { portalFamilyId: family.id, groupSlug, isActive: true } as any,
        orderBy: { sortOrder: 'asc' },
      });
    } catch {
      return [];
    }
  }

  // ── Registration Drafts (save-and-resume) ──────────────────────────────────

  async createRegistrationDraft(input: {
    portalFamily?: string;
    groupSlug?: string;
    subtypeSlug?: string;
    tierKey?: string;
    utmSource?: string;
    utmCampaign?: string;
  }) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    try {
      return await (this.prisma as any).registrationDraft.create({
        data: {
          portalFamily: input.portalFamily ?? 'diagnostic',
          groupSlug: input.groupSlug ?? null,
          subtypeSlug: input.subtypeSlug ?? null,
          tierKey: input.tierKey ?? null,
          utmSource: input.utmSource ?? null,
          utmCampaign: input.utmCampaign ?? null,
          expiresAt,
        },
      });
    } catch (err: any) {
      // If the table doesn't exist yet, return a stub draft so the wizard can
      // still function (we treat this as a non-persisted ephemeral session).
      return {
        id: null,
        token: `ephemeral-${Date.now()}`,
        currentStep: 1,
        portalFamily: input.portalFamily ?? 'diagnostic',
        groupSlug: input.groupSlug ?? null,
        subtypeSlug: input.subtypeSlug ?? null,
        tierKey: input.tierKey ?? null,
        facilityDetails: {},
        expiresAt,
        _ephemeral: true,
      };
    }
  }

  async getRegistrationDraft(token: string) {
    try {
      const draft = await (this.prisma as any).registrationDraft.findUnique({ where: { token } });
      if (!draft) throw new NotFoundException('Registration draft not found');
      if (draft.completedAt) throw new NotFoundException('Registration already completed');
      if (new Date(draft.expiresAt) < new Date()) throw new NotFoundException('Registration draft has expired');
      return draft;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('Registration draft unavailable');
    }
  }

  async updateRegistrationDraft(token: string, patch: Record<string, any>) {
    // Whitelist editable fields so clients can't set completedAt etc.
    const allowed = [
      'currentStep', 'groupSlug', 'subtypeSlug', 'tierKey',
      'billingCycle', 'facilityDetails', 'adminEmail', 'adminPhone',
    ];
    const data: any = {};
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    try {
      return await (this.prisma as any).registrationDraft.update({ where: { token }, data });
    } catch (err: any) {
      throw new NotFoundException('Registration draft not found or expired');
    }
  }
}
