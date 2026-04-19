import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ColdChainService } from './cold-chain.service';

@Controller('cold-chain')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ColdChainController {
  constructor(private svc: ColdChainService) {}

  @Get('logs')
  list(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.svc.listLogs(req.user.tenantId, { branchId });
  }

  @Post('logs')
  create(@Req() req: any, @Body() body: any) {
    return this.svc.createLog(req.user.tenantId, body);
  }
}
