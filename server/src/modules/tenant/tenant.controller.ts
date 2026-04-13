import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Tenant')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
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
