import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DicomViewerService } from './dicom-viewer.service';

@Controller('diagnostic/dicom-viewer')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DicomViewerController {
  constructor(private readonly service: DicomViewerService) {}

  @Get()
  async findAll(@Req() req: any, @Query() query: any) { return this.service.findAll(req.tenantId, query); }

  @Get('reports/stats')
  async stats(@Req() req: any) { return this.service.getStats(req.tenantId); }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) { return this.service.findOne(req.tenantId, id); }

  @Post()
  async create(@Req() req: any, @Body() dto: any) { return this.service.create(req.tenantId, dto, req.user?.id || req.userId); }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.update(req.tenantId, id, dto); }
}
