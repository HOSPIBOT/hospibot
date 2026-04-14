import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Tenant')
@Controller('tenants')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant details' })
  getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Get('current/branches')
  @ApiOperation({ summary: 'Get all branches' })
  getBranches(@CurrentTenant() tenantId: string) {
    return this.tenantService.getBranches(tenantId);
  }

  @Post('current/branches')
  @ApiOperation({ summary: 'Create a new branch' })
  createBranch(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.tenantService.createBranch(tenantId, dto);
  }

  @Patch('current/branches/:id')
  @ApiOperation({ summary: 'Update a branch' })
  updateBranch(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.tenantService.updateBranch(tenantId, id, dto);
  }

  @Patch('current/settings')
  @ApiOperation({ summary: 'Update tenant settings (WhatsApp config, notifications, etc.)' })
  updateSettings(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.tenantService.updateSettings(tenantId, dto);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update tenant profile (name, address, logo, etc.)' })
  update(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.tenantService.update(tenantId, dto);
  }
}
