// lab.controller.ts
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LabService } from './lab.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Laboratory')
@Controller('lab')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class LabController {
  constructor(private labService: LabService) {}

  // ── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Lab dashboard stats' })
  getDashboard(@CurrentTenant() tenantId: string) {
    return this.labService.getDashboardStats(tenantId);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Order trend for chart' })
  getTrend(@CurrentTenant() tenantId: string, @Query('days') days = 14) {
    return this.labService.getTrend(tenantId, +days);
  }

  // ── Test Catalog ──────────────────────────────────────────────────────────

  @Post('catalog/seed')
  @ApiOperation({ summary: 'Seed default test catalog (25 common tests)' })
  seedCatalog(@CurrentTenant() tenantId: string) {
    return this.labService.seedDefaultCatalog(tenantId).then(n => ({ seeded: n }));
  }

  @Get('catalog')
  @ApiOperation({ summary: 'List test catalog' })
  listCatalog(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.labService.listCatalog(tenantId, search, category);
  }

  @Post('catalog')
  @ApiOperation({ summary: 'Add test to catalog' })
  createTest(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.labService.createTest(tenantId, dto);
  }

  @Put('catalog/:id')
  @ApiOperation({ summary: 'Update test in catalog' })
  updateTest(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.labService.updateTest(tenantId, id, dto);
  }

  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Deactivate test from catalog' })
  deleteTest(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.labService.deleteTest(tenantId, id);
  }

  // ── Lab Orders ────────────────────────────────────────────────────────────

  @Post('orders')
  @ApiOperation({ summary: 'Create lab order' })
  createOrder(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.labService.createOrder(tenantId, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List lab orders with filters' })
  listOrders(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.labService.listOrders(tenantId, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get single lab order' })
  getOrder(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.labService.getOrderById(tenantId, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update lab order status' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.labService.updateStatus(tenantId, id, status);
  }

  @Post('orders/:id/report')
  @ApiOperation({ summary: 'Upload report URL and auto-deliver via WhatsApp' })
  uploadReport(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { reportUrl: string; reportData?: any },
  ) {
    return this.labService.uploadReport(tenantId, id, body.reportUrl, body.reportData);
  }


  @Patch('orders/:id')
  @ApiOperation({ summary: 'Update lab order fields (reportUrl, remarks, etc.)' })
  updateOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { reportUrl?: string; remarks?: string; notes?: string },
  ) {
    return this.labService.updateOrder(tenantId, id, body);
  }

  @Post('orders/:id/deliver')
  @ApiOperation({ summary: 'Deliver existing report via WhatsApp' })
  deliverReport(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.labService.deliverReport(tenantId, id);
  }

  // ── Home Collection ───────────────────────────────────────────────────────

  @Post('collection')
  @ApiOperation({ summary: 'Schedule home sample collection' })
  scheduleCollection(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.labService.scheduleHomeCollection(tenantId, dto);
  }

  @Get('collection')
  @ApiOperation({ summary: 'List home collections' })
  listCollections(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.labService.listHomeCollections(tenantId, query);
  }

  @Patch('collection/:id/status')
  @ApiOperation({ summary: 'Update collection status' })
  updateCollectionStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: string; technicianName?: string },
  ) {
    return this.labService.updateCollectionStatus(tenantId, id, body.status, body.technicianName);
  }
}
