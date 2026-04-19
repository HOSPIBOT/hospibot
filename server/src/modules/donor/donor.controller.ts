import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DonorService } from './donor.service';

@Controller('donor')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DonorController {
  constructor(private svc: DonorService) {}

  @Get('registry')
  list(@Req() req: any, @Query('bloodGroup') bloodGroup?: string, @Query('deferred') deferred?: string) {
    return this.svc.listDonors(req.user.tenantId, { bloodGroup, deferred });
  }

  @Get('registry/:id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.getDonor(req.user.tenantId, id);
  }

  @Post('registry')
  register(@Req() req: any, @Body() body: any) {
    return this.svc.registerDonor(req.user.tenantId, body);
  }

  @Post('registry/:id/donation')
  recordDonation(@Req() req: any, @Param('id') id: string) {
    return this.svc.recordDonation(req.user.tenantId, id);
  }

  @Patch('registry/:id/deferral')
  setDeferral(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    // body = { reason, until } to set, or { clear: true } to remove
    if (body?.clear) {
      return this.svc.setDeferral(req.user.tenantId, id, null);
    }
    return this.svc.setDeferral(req.user.tenantId, id, body);
  }
}
