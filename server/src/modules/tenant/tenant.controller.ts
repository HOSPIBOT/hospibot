import { Controller, Get, UseGuards } from '@nestjs/common';
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
  async getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  @Get('current/branches')
  @ApiOperation({ summary: 'Get all branches' })
  async getBranches(@CurrentTenant() tenantId: string) {
    return this.tenantService.getBranches(tenantId);
  }
}
