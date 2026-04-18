import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * ControlPlaneService — owns the Super Admin configuration plane:
 * tier pricing, feature catalog, and feature gates per (subtype × tier).
 *
 * Design goals:
 *   1. Super Admin edits are persistent and take effect on the next
 *      registration / feature check without code deploys.
 *   2. Reads are cheap — the gate resolver does at most one query.
 *   3. Writes audit via `updatedBy` so we can trace who changed what.
 *
 * All methods are wrapped in try/catch for graceful fallback during the
 * brief window after a schema push but before seed has completed.
 */
@Injectable()
export class ControlPlaneService {
  constructor(private prisma: PrismaService) {}

  /* ── Tier Configs ──────────────────────────────────────────────────────── */

  /**
   * Return tier configs for a given scope, resolving in order:
   * 'subtype:<slug>' → 'family:<slug>' → 'default'.
   * The first matching (scope, tierKey) wins per tier.
   *
   * Use case: registration wizard passes `{subtypeSlug, familySlug}` and
   * gets back exactly 4 rows (one per tier) ready to render.
   */
  async getResolvedTiers(params: { familySlug?: string; subtypeSlug?: string }) {
    const scopes = ['default'];
    if (params.familySlug) scopes.unshift(`family:${params.familySlug}`);
    if (params.subtypeSlug) scopes.unshift(`subtype:${params.subtypeSlug}`);
    try {
      const rows = await (this.prisma as any).tierConfig.findMany({
        where: { scope: { in: scopes }, isActive: true },
        orderBy: [{ sortOrder: 'asc' }],
      });
      // For each tierKey, pick the highest-priority scope match.
      const resolved: Record<string, any> = {};
      for (const scope of scopes) {
        for (const row of rows) {
          if (row.scope === scope && !resolved[row.tierKey]) {
            resolved[row.tierKey] = row;
          }
        }
      }
      return Object.values(resolved).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    } catch {
      return [];
    }
  }

  async listAllTierConfigs(scope?: string) {
    try {
      return await (this.prisma as any).tierConfig.findMany({
        where: scope ? { scope } : {},
        orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }],
      });
    } catch {
      return [];
    }
  }

  async getTierConfig(id: string) {
    const row = await (this.prisma as any).tierConfig.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Tier config not found');
    return row;
  }

  async updateTierConfig(id: string, patch: Record<string, any>, updatedBy?: string) {
    const allowed = [
      'displayName', 'tagline', 'priceMonthly', 'priceAnnual', 'currency',
      'color', 'badge', 'dailyVolumeMin', 'dailyVolumeMax',
      'branchesAllowed', 'staffAllowed', 'waMessagesPerMonth', 'smsPerMonth',
      'storageGB', 'isActive', 'sortOrder',
    ];
    const data: any = {};
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    if (updatedBy) data.updatedBy = updatedBy;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No editable fields in request');
    }
    try {
      return await (this.prisma as any).tierConfig.update({ where: { id }, data });
    } catch (err: any) {
      throw new NotFoundException('Tier config not found or could not be updated');
    }
  }

  /* ── Feature Definitions ───────────────────────────────────────────────── */

  async listFeatures(portalFamilySlug?: string) {
    try {
      return await (this.prisma as any).featureDefinition.findMany({
        where: {
          isActive: true,
          ...(portalFamilySlug ? { portalFamilySlug } : {}),
        },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });
    } catch {
      return [];
    }
  }

  async createFeature(data: {
    key: string; name: string; description: string; category: string;
    portalFamilySlug?: string;
  }) {
    if (!/^[a-z0-9-]+$/.test(data.key)) {
      throw new BadRequestException('Feature key must be lowercase letters, numbers, and hyphens only');
    }
    try {
      return await (this.prisma as any).featureDefinition.create({ data });
    } catch (err: any) {
      throw new BadRequestException(`Could not create feature: ${err?.message ?? 'unknown error'}`);
    }
  }

  async updateFeature(id: string, patch: Record<string, any>) {
    const allowed = ['name', 'description', 'category', 'sortOrder', 'isActive'];
    const data: any = {};
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    try {
      return await (this.prisma as any).featureDefinition.update({ where: { id }, data });
    } catch {
      throw new NotFoundException('Feature not found');
    }
  }

  /* ── Feature Gates (the matrix) ────────────────────────────────────────── */

  /**
   * Return the full feature matrix for a given subtype — one row per feature,
   * one column per tier. The Super Admin UI edits this grid directly.
   *
   * Resolution rule matches getResolvedFlags(): most-specific wins.
   */
  async getFeatureMatrix(subtypeSlug: string) {
    try {
      const [features, gates] = await Promise.all([
        (this.prisma as any).featureDefinition.findMany({
          where: { isActive: true, portalFamilySlug: 'diagnostic' },
          orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
        }),
        (this.prisma as any).featureGate.findMany({
          where: {
            OR: [
              { subtypeSlug, tierKey: { in: ['small', 'medium', 'large', 'enterprise', 'default'] } },
              { subtypeSlug: 'default' },
            ],
          },
        }),
      ]);

      // Build lookup: { featureKey: { tierKey: {isEnabled, scope, id} } }
      type GateCell = { id: string; isEnabled: boolean; scope: 'subtype' | 'default' };
      const matrix: Record<string, Record<string, GateCell>> = {};
      // Most-specific first so the later default pass doesn't overwrite.
      const specific = gates.filter((g: any) => g.subtypeSlug === subtypeSlug);
      const def = gates.filter((g: any) => g.subtypeSlug === 'default');
      for (const g of specific) {
        if (!matrix[g.featureKey]) matrix[g.featureKey] = {};
        const tiers = g.tierKey === 'default' ? ['small', 'medium', 'large', 'enterprise'] : [g.tierKey];
        for (const t of tiers) {
          matrix[g.featureKey][t] = { id: g.id, isEnabled: g.isEnabled, scope: 'subtype' };
        }
      }
      for (const g of def) {
        if (!matrix[g.featureKey]) matrix[g.featureKey] = {};
        const tiers = g.tierKey === 'default' ? ['small', 'medium', 'large', 'enterprise'] : [g.tierKey];
        for (const t of tiers) {
          if (!matrix[g.featureKey][t]) {
            matrix[g.featureKey][t] = { id: g.id, isEnabled: g.isEnabled, scope: 'default' };
          }
        }
      }

      return { features, matrix };
    } catch {
      return { features: [], matrix: {} };
    }
  }

  /**
   * Upsert a single (subtypeSlug, tierKey, featureKey) gate. Called from the
   * Super Admin matrix UI on every cell toggle.
   */
  async setGate(params: {
    subtypeSlug: string; tierKey: string; featureKey: string;
    isEnabled: boolean; updatedBy?: string; notes?: string;
  }) {
    try {
      return await (this.prisma as any).featureGate.upsert({
        where: {
          subtypeSlug_tierKey_featureKey: {
            subtypeSlug: params.subtypeSlug,
            tierKey: params.tierKey,
            featureKey: params.featureKey,
          },
        },
        create: {
          subtypeSlug: params.subtypeSlug,
          tierKey: params.tierKey,
          featureKey: params.featureKey,
          isEnabled: params.isEnabled,
          updatedBy: params.updatedBy ?? null,
          notes: params.notes ?? null,
        },
        update: {
          isEnabled: params.isEnabled,
          updatedBy: params.updatedBy ?? null,
          notes: params.notes ?? null,
        },
      });
    } catch (err: any) {
      throw new BadRequestException(`Could not update gate: ${err?.message ?? 'unknown'}`);
    }
  }

  /**
   * The runtime lookup — is `featureKey` enabled for a given tenant?
   * Called by TierGuard and frontend PortalLayout.
   *
   * Resolution: subtype-specific wins over default. Within same scope,
   * exact tierKey beats tierKey='default'.
   */
  async isFeatureEnabled(subtypeSlug: string, tierKey: string, featureKey: string): Promise<boolean> {
    try {
      const rows = await (this.prisma as any).featureGate.findMany({
        where: {
          featureKey,
          OR: [
            { subtypeSlug, tierKey },
            { subtypeSlug, tierKey: 'default' },
            { subtypeSlug: 'default', tierKey },
            { subtypeSlug: 'default', tierKey: 'default' },
          ],
        },
      });
      // Priority: most specific match wins
      const pick = (s: string, t: string) =>
        rows.find((r: any) => r.subtypeSlug === s && r.tierKey === t);
      const match = pick(subtypeSlug, tierKey)
                 ?? pick(subtypeSlug, 'default')
                 ?? pick('default', tierKey)
                 ?? pick('default', 'default');
      return match ? match.isEnabled : false;
    } catch {
      return false;
    }
  }
}
