import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CultureService } from './culture.service';

@Controller('culture')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CultureController {
  constructor(private svc: CultureService) {}

  @Get('trackings')
  list(@Req() req: any, @Query('status') status?: string) {
    return this.svc.listCultures(req.user.tenantId, { status });
  }

  @Post('trackings')
  create(@Req() req: any, @Body() body: any) {
    return this.svc.createCulture(req.user.tenantId, body);
  }

  @Patch('trackings/:id')
  updateGrowth(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateGrowth(req.user.tenantId, id, body);
  }
}
