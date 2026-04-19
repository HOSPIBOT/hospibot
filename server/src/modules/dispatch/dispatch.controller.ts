import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DispatchService } from './dispatch.service';

@Controller('dispatch')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DispatchController {
  constructor(private svc: DispatchService) {}

  @Get('manifests')
  list(@Req() req: any, @Query('branchId') branchId?: string, @Query('status') status?: string) {
    return this.svc.listManifests(req.user.tenantId, { branchId, status });
  }

  @Get('manifests/:id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.getManifest(req.user.tenantId, id);
  }

  @Post('manifests')
  create(@Req() req: any, @Body() body: any) {
    return this.svc.createManifest(req.user.tenantId, body);
  }

  @Patch('manifests/:id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateStatus(req.user.tenantId, id, body);
  }
}
