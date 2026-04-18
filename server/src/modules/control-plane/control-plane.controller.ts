import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ControlPlaneService } from './control-plane.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Two mount points on one service:
 *
 *   /portal/tier-configs        Public reads for the registration wizard
 *   /portal/features/:subtype/matrix  Public read for the wizard's tier-feature card
 *
 *   /super-admin/tier-configs   Super Admin CRUD
 *   /super-admin/features       Feature catalog CRUD
 *   /super-admin/feature-gates  Matrix toggles
 *
 * Keeping two controllers (public + admin) in this file to avoid circular
 * imports between modules. Public endpoints have no guards; admin ones
 * require SUPER_ADMIN role.
 */

@ApiTags('Portal — Control Plane (public)')
@Controller('portal')
export class ControlPlanePublicController {
  constructor(private service: ControlPlaneService) {}

  @Get('tier-configs')
  @ApiOperation({ summary: 'Resolved tier configs for a given (family, subtype) — used by the registration wizard' })
  getResolvedTiers(
    @Query('family') familySlug?: string,
    @Query('subtype') subtypeSlug?: string,
  ) {
    return this.service.getResolvedTiers({ familySlug, subtypeSlug });
  }

  @Get('features/:subtypeSlug/matrix')
  @ApiOperation({ summary: 'Feature × tier matrix for a subtype — public read, used by both wizard and Super Admin UI' })
  getFeatureMatrix(@Param('subtypeSlug') subtypeSlug: string) {
    return this.service.getFeatureMatrix(subtypeSlug);
  }
}

@ApiTags('Super Admin — Control Plane')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class ControlPlaneAdminController {
  constructor(private service: ControlPlaneService) {}

  /* ── Tier Configs ──────────────────────────────────────────────────── */

  @Get('tier-configs')
  listTierConfigs(@Query('scope') scope?: string) {
    return this.service.listAllTierConfigs(scope);
  }

  @Get('tier-configs/:id')
  getTierConfig(@Param('id') id: string) {
    return this.service.getTierConfig(id);
  }

  @Patch('tier-configs/:id')
  @ApiOperation({ summary: 'Update pricing, limits, or metadata for a tier' })
  updateTierConfig(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateTierConfig(id, body ?? {}, userId);
  }

  /* ── Feature Definitions ──────────────────────────────────────────── */

  @Get('features')
  listFeatures(@Query('family') family?: string) {
    return this.service.listFeatures(family);
  }

  @Post('features')
  @ApiOperation({ summary: 'Create a new feature in the catalog' })
  createFeature(@Body() body: any) {
    return this.service.createFeature(body);
  }

  @Patch('features/:id')
  updateFeature(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFeature(id, body ?? {});
  }

  /* ── Feature Gates (matrix cell toggles) ──────────────────────────── */

  @Patch('feature-gates')
  @ApiOperation({ summary: 'Upsert a feature gate for (subtypeSlug, tierKey, featureKey)' })
  setGate(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.service.setGate({
      subtypeSlug: body?.subtypeSlug,
      tierKey:     body?.tierKey,
      featureKey:  body?.featureKey,
      isEnabled:   !!body?.isEnabled,
      notes:       body?.notes ?? undefined,
      updatedBy:   userId,
    });
  }
}
