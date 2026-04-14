import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private portalService: PortalService) {}

  // ── Public endpoints (registration wizard, login pages) ───────────────────

  @Get('registration-context')
  @ApiOperation({ summary: 'Get all families, sub-types & assets for registration wizard' })
  getRegistrationContext() {
    return this.portalService.getRegistrationContext();
  }

  @Get('families')
  @ApiOperation({ summary: 'List all active portal families' })
  getFamilies(@Query('includeInactive') inc?: string) {
    return this.portalService.getAllFamilies(inc === 'true');
  }

  @Get('families/:slug')
  @ApiOperation({ summary: 'Get portal family with sub-types by slug' })
  getFamilyBySlug(@Param('slug') slug: string) {
    return this.portalService.getFamilyBySlug(slug);
  }

  @Get('families/:slug/theme')
  @ApiOperation({ summary: 'Get portal theme colors by family slug' })
  getThemeBySlug(@Param('slug') slug: string) {
    return this.portalService.getThemeBySlug(slug);
  }

  @Get('families/:familySlug/subtypes/:subTypeSlug')
  @ApiOperation({ summary: 'Get specific sub-type feature flags' })
  getSubType(@Param('familySlug') familySlug: string, @Param('subTypeSlug') subTypeSlug: string) {
    return this.portalService.getSubTypeBySlug(familySlug, subTypeSlug);
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get platform-wide assets (logo, tagline)' })
  getAssets() {
    return this.portalService.getPlatformAssets();
  }

  @Get('subtypes')
  @ApiOperation({ summary: 'List all sub-types (optionally filter by familyId)' })
  getAllSubTypes(@Query('familyId') familyId?: string) {
    return this.portalService.getAllSubTypes(familyId);
  }

  @Get('themes')
  @ApiOperation({ summary: 'List all portal themes' })
  getAllThemes() {
    return this.portalService.getAllThemes();
  }

  // ── Super Admin only ──────────────────────────────────────────────────────

  @Post('families')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Create new portal family' })
  createFamily(@Body() body: any) {
    return this.portalService.createFamily(body);
  }

  @Patch('families/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Update portal family' })
  updateFamily(@Param('id') id: string, @Body() body: any) {
    return this.portalService.updateFamily(id, body);
  }

  @Patch('families/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Enable/disable portal family' })
  toggleFamily(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.portalService.toggleFamily(id, isActive);
  }

  @Patch('families/:id/theme')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Update portal theme colors' })
  updateTheme(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.portalService.updateTheme(id, body, user.id);
  }

  @Post('subtypes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Create new sub-type' })
  createSubType(@Body() body: any) {
    return this.portalService.createSubType(body);
  }

  @Patch('subtypes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Update sub-type' })
  updateSubType(@Param('id') id: string, @Body() body: any) {
    return this.portalService.updateSubType(id, body);
  }

  @Patch('subtypes/:id/feature-flags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Update sub-type feature flags' })
  updateFeatureFlags(@Param('id') id: string, @Body('featureFlags') flags: Record<string, boolean>) {
    return this.portalService.updateSubTypeFeatureFlags(id, flags);
  }

  @Patch('subtypes/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Enable/disable sub-type' })
  toggleSubType(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.portalService.toggleSubType(id, isActive);
  }

  @Patch('assets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[SA] Update platform assets (logo, tagline)' })
  updateAssets(@Body() body: any, @CurrentUser() user: any) {
    return this.portalService.updatePlatformAssets(body, user.id);
  }
}
