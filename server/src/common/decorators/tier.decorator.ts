import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../guards/tenant.guard';
import { TierGuard, REQUIRE_TIER_KEY, REQUIRE_FEATURE_KEY } from '../guards/tier.guard';

/**
 * Decorator: mark an endpoint as requiring a minimum lab tier.
 *
 * @example
 *   @Get('qc/runs')
 *   @RequireTier('large')
 *   listQcRuns() { ... }
 */
export const RequireTier = (tier: 'small' | 'medium' | 'large' | 'enterprise') =>
  applyDecorators(
    SetMetadata(REQUIRE_TIER_KEY, tier),
    UseGuards(AuthGuard('jwt'), TenantGuard, TierGuard),
  );

/**
 * Decorator: mark an endpoint as requiring a specific feature flag.
 * Tier + subtype are checked against the server-side FEATURE_GATES map.
 *
 * @example
 *   @Get('doctor-crm/list')
 *   @RequireFeature('doctor-crm')
 *   listDoctors() { ... }
 */
export const RequireFeature = (feature: string) =>
  applyDecorators(
    SetMetadata(REQUIRE_FEATURE_KEY, feature),
    UseGuards(AuthGuard('jwt'), TenantGuard, TierGuard),
  );
