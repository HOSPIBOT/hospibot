import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UpdateTenantStatusDto,
  UpdateTenantPlanDto,
  CreateAnnouncementDto,
  PlatformSettingsDto,
} from './dto/super-admin.dto';

@ApiTags('Super Admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  // ─── Platform Analytics ───────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide stats and analytics' })
  getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }

  // ─── Tenant Management ────────────────────────────────────────────────────

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] })
  @ApiQuery({ name: 'plan', required: false, enum: ['STARTER', 'GROWTH', 'ENTERPRISE'] })
  getAllTenants(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.superAdminService.getAllTenants(+page, +limit, search, status, plan);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get full tenant details by ID' })
  getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Activate, suspend, or cancel a tenant' })
  updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.superAdminService.updateTenantStatus(id, dto);
  }

  @Patch('tenants/:id/plan')
  @ApiOperation({ summary: 'Change a tenant\'s subscription plan' })
  updateTenantPlan(
    @Param('id') id: string,
    @Body() dto: UpdateTenantPlanDto,
  ) {
    return this.superAdminService.updateTenantPlan(id, dto);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a tenant and all its data' })
  deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all platform users with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.getAllUsers(+page, +limit, search, role, status);
  }

  // ─── Announcements ────────────────────────────────────────────────────────

  @Get('announcements')
  @ApiOperation({ summary: 'List platform announcements' })
  getAnnouncements(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.superAdminService.getAnnouncements(Number(page), Number(limit));
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create and broadcast a platform announcement' })
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.createAnnouncement(dto, user.id);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get platform-wide settings' })
  getPlatformSettings() {
    return this.superAdminService.getPlatformSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform-wide settings' })
  updatePlatformSettings(@Body() dto: PlatformSettingsDto) {
    return this.superAdminService.updatePlatformSettings(dto);
  }

  // ─── System Health ────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Platform-wide audit logs (all tenants)' })
  getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.superAdminService.getAuditLogs({ page: Number(page), limit: Number(limit), action, tenantId });
  }

  @Get('health')
  @ApiOperation({ summary: 'Get real-time system health and metrics' })
  getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }
}
