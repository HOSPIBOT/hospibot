import {
  Controller, Get, Post, Patch, Param, Body, Query, Req, Res,
  UseGuards, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AntibiogramService } from './antibiogram.service';

@Controller('diagnostic/antibiogram')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AntibiogramController {
  constructor(private readonly service: AntibiogramService) {}

  // ─── LIST antibiograms ──────────────────────
  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.tenantId, query);
  }

  // ──────────────────────────────────────────────
  // IMPORTANT: Specific routes MUST come BEFORE
  // @Get(':id') — otherwise NestJS treats "reports"
  // as an :id parameter value and returns 404.
  // ──────────────────────────────────────────────

  // ─── CUMULATIVE ANTIBIOGRAM (CLSI M39) ──────
  @Get('reports/cumulative')
  async cumulative(@Req() req: any, @Query() query: any) {
    return this.service.getCumulativeAntibiogram(req.tenantId, query);
  }

  // ─── WHONET EXPORT (CSV download) ───────────
  @Get('reports/whonet-export')
  async whonetExport(@Req() req: any, @Query() query: any, @Res() res: Response) {
    const result = await this.service.exportWhonet(req.tenantId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(HttpStatus.OK).send(result.csv);
  }

  // ─── AMR ALERT STATS ───────────────────────
  @Get('reports/alert-stats')
  async alertStats(@Req() req: any, @Query() query: any) {
    return this.service.getAlertStats(req.tenantId, query);
  }

  // ─── GET single antibiogram (AFTER specific routes) ──
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.tenantId, id);
  }

  // ─── CREATE antibiogram + results ───────────
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.tenantId, dto, req.user?.id || req.userId);
  }

  // ─── UPDATE antibiogram ─────────────────────
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(req.tenantId, id, dto);
  }

  // ─── VERIFY (Microbiologist sign-off) ───────
  @Patch(':id/verify')
  async verify(@Req() req: any, @Param('id') id: string) {
    return this.service.verify(req.tenantId, id, req.user?.id || req.userId);
  }
}
