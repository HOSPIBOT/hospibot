import {
  Controller, Get, Post, Patch, Param, Body, Query, Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CustodyChainService } from './custody-chain.service';

@Controller('diagnostic/chain-of-custody')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustodyChainController {
  constructor(private readonly service: CustodyChainService) {}

  // ─── LIST custody chains ────────────────────
  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.tenantId, query);
  }

  // ── Specific routes BEFORE :id ──────────────
  @Get('reports/integrity')
  async integrityReport(@Req() req: any, @Query() query: any) {
    return this.service.getIntegrityReport(req.tenantId, query);
  }

  // ─── GET single chain ──────────────────────
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.tenantId, id);
  }

  // ─── CREATE chain ──────────────────────────
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.tenantId, dto, req.user?.id || req.userId);
  }

  // ─── UPDATE chain ──────────────────────────
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(req.tenantId, id, dto);
  }

  // ─── TRANSITION STATUS ─────────────────────
  @Patch(':id/status')
  async transitionStatus(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.transitionStatus(req.tenantId, id, dto.status, req.user?.id || req.userId);
  }

  // ─── ADD HANDOVER STEP ─────────────────────
  @Post(':id/handover')
  async addHandover(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.addHandover(req.tenantId, id, dto, req.user?.id || req.userId);
  }

  // ─── RECEIVE AT LAB ────────────────────────
  @Patch(':id/receive')
  async receiveAtLab(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.receiveAtLab(req.tenantId, id, dto, req.user?.id || req.userId);
  }
}
