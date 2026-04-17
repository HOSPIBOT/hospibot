import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

/**
 * Tier hierarchy: higher numbers include everything below
 */
const TIER_RANK: Record<string, number> = {
  small: 1, medium: 2, large: 3, enterprise: 4,
};

export const REQUIRE_TIER_KEY = 'requireTier';
export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * TierGuard: Enforces the minimum lab tier required to access an endpoint.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
 *   @RequireTier('medium')
 *   @Get('doctor-crm')
 *   listDoctorReferrals(...)
 *
 * Or with a named feature:
 *   @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
 *   @RequireFeature('qc-westgard')
 *   @Get('qc/runs')
 *   listQcRuns(...)
 *
 * Works by reading tenant.settings.labTier from DB (on login it's cached
 * into the user's JWT context, but we re-read from DB here as source of
 * truth — tenants might have been upgraded mid-session).
 */
@Injectable()
export class TierGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<string>(REQUIRE_TIER_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(), context.getClass(),
    ]);

    // If neither decorator is present, let the request through
    if (!requiredTier && !requiredFeature) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.tenantId) throw new ForbiddenException('Authentication required');

    // Fetch the tenant's current labTier from settings
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        settings: true,
        subType: { select: { slug: true } },
      },
    });
    if (!tenant) throw new ForbiddenException('Tenant not found');

    const settings = (tenant.settings ?? {}) as Record<string, any>;
    const userTier: string | undefined = settings.labTier;

    // ── Direct tier check ──────────────────────────────────────────
    if (requiredTier) {
      const userRank = userTier ? TIER_RANK[userTier] ?? 0 : 0;
      const requiredRank = TIER_RANK[requiredTier] ?? 99;
      if (userRank < requiredRank) {
        throw new ForbiddenException({
          message: `This feature requires the ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher.`,
          currentTier: userTier || 'none',
          requiredTier,
          upgradeUrl: '/diagnostic/settings/plan',
        });
      }
    }

    // ── Feature-flag check ─────────────────────────────────────────
    // Uses the same map as the frontend (duplicated here for server-side enforcement)
    if (requiredFeature) {
      const allowed = FEATURE_GATES[requiredFeature];
      if (!allowed) {
        // Unknown feature — allow (safer than blocking unintentionally)
        return true;
      }
      const userRank = userTier ? TIER_RANK[userTier] ?? 0 : 0;
      const requiredRank = TIER_RANK[allowed.minTier] ?? 99;
      if (userRank < requiredRank) {
        throw new ForbiddenException({
          message: `Feature "${requiredFeature}" requires the ${allowed.minTier} plan or higher.`,
          currentTier: userTier || 'none',
          requiredTier: allowed.minTier,
          feature: requiredFeature,
          upgradeUrl: '/diagnostic/settings/plan',
        });
      }
      // Subtype restriction
      const subtype = tenant.subType?.slug;
      if (allowed.allowedSubtypes && subtype && !allowed.allowedSubtypes.includes(subtype)) {
        throw new ForbiddenException({
          message: `Feature "${requiredFeature}" is not available for your lab type.`,
          feature: requiredFeature,
          subtype,
        });
      }
    }

    return true;
  }
}

/**
 * Server-side mirror of the diagnostic feature gates.
 * Kept intentionally small — only the flags that gate real API endpoints.
 * Frontend has the full list for UI purposes.
 */
const FEATURE_GATES: Record<string, { minTier: string; allowedSubtypes?: string[] }> = {
  'critical-alerts':    { minTier: 'medium' },
  'delta-check':        { minTier: 'medium' },
  'home-collection-basic': {
    minTier: 'medium',
    allowedSubtypes: ['pathology-lab', 'home-collection', 'reference-lab'],
  },
  'doctor-crm':         { minTier: 'medium' },
  'corporate-clients':  { minTier: 'medium' },
  'tpa-claims':         { minTier: 'medium' },
  'hl7-astm':           {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab', 'reference-lab', 'molecular-lab'],
  },
  'qc-westgard':        {
    minTier: 'large',
    allowedSubtypes: ['pathology-lab', 'reference-lab', 'molecular-lab'],
  },
  'nabl-compliance':    { minTier: 'large' },
  'multi-branch':       { minTier: 'large' },
  'staff-hrms':         { minTier: 'large' },
  'pacs-integration':   {
    minTier: 'large',
    allowedSubtypes: ['radiology-center', 'tele-radiology', 'pet-scan'],
  },
  'tele-radiology-routing': {
    minTier: 'large',
    allowedSubtypes: ['radiology-center', 'tele-radiology'],
  },
  'franchise-mgmt':     { minTier: 'enterprise' },
  'revenue-sharing':    { minTier: 'enterprise' },
  'white-label':        { minTier: 'enterprise' },
  'api-marketplace':    { minTier: 'enterprise' },
  'abha-abdm':          { minTier: 'enterprise' },
  'gov-reporting':      {
    minTier: 'enterprise',
    allowedSubtypes: ['pathology-lab', 'reference-lab', 'molecular-lab'],
  },
};
