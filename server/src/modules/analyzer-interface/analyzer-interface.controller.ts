import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AnalyzerInterfaceService } from './analyzer-interface.service';

@Controller('analyzer-interface')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyzerInterfaceController {
  constructor(private readonly service: AnalyzerInterfaceService) {}

  // Analyzer management
  @Get('analyzers') async getAnalyzers(@Req() req: any) { return this.service.getAnalyzers(req.tenantId); }
  @Post('analyzers') async registerAnalyzer(@Req() req: any, @Body() dto: any) { return this.service.registerAnalyzer(req.tenantId, dto, req.user?.id || req.userId); }
  @Patch('analyzers/:id') async updateAnalyzer(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateAnalyzer(req.tenantId, id, dto); }

  // Message processing (called by analyzer interface engine or directly)
  @Post('receive/hl7') async receiveHL7(@Req() req: any, @Body() body: { message: string }) { return this.service.processMessage(req.tenantId, body.message, 'hl7'); }
  @Post('receive/astm') async receiveASTM(@Req() req: any, @Body() body: { message: string }) { return this.service.processMessage(req.tenantId, body.message, 'astm'); }

  // Message history & results
  @Get('messages') async getMessages(@Req() req: any, @Query() query: any) { return this.service.getMessages(req.tenantId, query); }
  @Get('messages/:id/results') async getResults(@Req() req: any, @Param('id') id: string) { return this.service.getResults(req.tenantId, id); }

  // Approve results
  @Post('messages/:id/approve') async approveResults(@Req() req: any, @Param('id') id: string) { return this.service.approveResults(req.tenantId, id, req.user?.id || req.userId); }

  // Stats
  @Get('stats') async getStats(@Req() req: any) { return this.service.getStats(req.tenantId); }
}
