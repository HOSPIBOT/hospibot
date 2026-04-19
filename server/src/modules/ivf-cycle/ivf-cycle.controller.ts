import {
  Controller, Get, Post, Patch, Param, Body, Query, Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { IvfCycleService } from './ivf-cycle.service';

@Controller('diagnostic/ivf-cycles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class IvfCycleController {
  constructor(private readonly service: IvfCycleService) {}

  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.tenantId, query);
  }

  // Specific routes BEFORE :id
  @Get('reports/outcomes')
  async outcomeStats(@Req() req: any, @Query() query: any) {
    return this.service.getOutcomeStats(req.tenantId, query);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.tenantId, dto, req.user?.id || req.userId);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(req.tenantId, id, dto);
  }

  @Patch(':id/status')
  async transitionStatus(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.transitionStatus(req.tenantId, id, dto.status, req.user?.id || req.userId);
  }
}
