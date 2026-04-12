// pharmacy.controller.ts
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Pharmacy')
@Controller('pharmacy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PharmacyController {
  constructor(private pharmacyService: PharmacyService) {}

  @Get('dashboard')
  getDashboard(@CurrentTenant() tenantId: string) {
    return this.pharmacyService.getDashboardStats(tenantId);
  }

  @Get('revenue-trend')
  getRevenueTrend(@CurrentTenant() tenantId: string, @Query('days') days = 14) {
    return this.pharmacyService.getRevenueTrend(tenantId, +days);
  }

  @Get('metadata')
  getMetadata() { return this.pharmacyService.getMetadata(); }

  // ── Products ────────────────────────────────────────────────────────────────
  @Get('products')
  listProducts(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.pharmacyService.listProducts(tenantId, query);
  }

  @Post('products')
  createProduct(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.pharmacyService.createProduct(tenantId, dto);
  }

  @Put('products/:id')
  updateProduct(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.pharmacyService.updateProduct(tenantId, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.pharmacyService.deleteProduct(tenantId, id);
  }

  // ── Batches ─────────────────────────────────────────────────────────────────
  @Post('products/:id/batches')
  addBatch(@CurrentTenant() tenantId: string, @Param('id') productId: string, @Body() dto: any) {
    return this.pharmacyService.addBatch(tenantId, productId, dto);
  }

  // ── Inventory Alerts ────────────────────────────────────────────────────────
  @Get('alerts')
  getAlerts(@CurrentTenant() tenantId: string) {
    return this.pharmacyService.getInventoryAlerts(tenantId);
  }

  // ── Dispensing ──────────────────────────────────────────────────────────────
  @Get('dispensing')
  listDispensing(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.pharmacyService.listDispensing(tenantId, query);
  }

  @Post('dispensing')
  createOrder(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.pharmacyService.createDispensingOrder(tenantId, dto);
  }

  @Post('dispensing/:id/dispense')
  dispenseOrder(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.pharmacyService.dispenseOrder(tenantId, id);
  }

  // ── Suppliers ───────────────────────────────────────────────────────────────
  @Get('suppliers')
  listSuppliers(@CurrentTenant() tenantId: string) {
    return this.pharmacyService.listSuppliers(tenantId);
  }

  @Post('suppliers')
  createSupplier(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.pharmacyService.createSupplier(tenantId, dto);
  }

  @Put('suppliers/:id')
  updateSupplier(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.pharmacyService.updateSupplier(tenantId, id, dto);
  }

  // ── Purchase Orders ─────────────────────────────────────────────────────────
  @Get('purchase-orders')
  listPurchaseOrders(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.pharmacyService.listPurchaseOrders(tenantId, query);
  }

  @Post('purchase-orders')
  createPurchaseOrder(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.pharmacyService.createPurchaseOrder(tenantId, dto);
  }

  @Post('purchase-orders/:id/receive')
  receivePurchaseOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { items: any[] },
  ) {
    return this.pharmacyService.receivePurchaseOrder(tenantId, id, body.items);
  }
}
