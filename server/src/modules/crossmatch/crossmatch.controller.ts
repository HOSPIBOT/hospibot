import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CrossmatchService } from './crossmatch.service';

@Controller('crossmatch')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CrossmatchController {
  constructor(private svc: CrossmatchService) {}

  @Get('records')
  list(@Req() req: any, @Query('result') result?: string) {
    return this.svc.listRecords(req.user.tenantId, { result });
  }

  @Post('records')
  create(@Req() req: any, @Body() body: any) {
    return this.svc.createRecord(req.user.tenantId, body);
  }

  @Patch('records/:id/issue')
  issue(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.issueUnit(req.user.tenantId, id, body);
  }
}
