// marketplace.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TierGuard } from '../../common/guards/tier.guard';
import { RequireFeature } from '../../common/decorators/tier.decorator';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  // ── Public endpoints (no auth required) ───────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Browse marketplace products (public)' })
  listProducts(@Query() query: any) {
    return this.marketplaceService.listProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get single product details (public)' })
  getProduct(@Param('id') id: string) {
    return this.marketplaceService.getProduct(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get product categories' })
  getCategories() { return this.marketplaceService.getCategories(); }

  @Get('stats')
  @ApiOperation({ summary: 'Marketplace stats' })
  getStats() { return this.marketplaceService.getStats(); }

  @Post('orders')
  @ApiOperation({ summary: 'Place a marketplace order (public)' })
  createOrder(@Body() dto: any) {
    return this.marketplaceService.createOrder(dto);
  }

  // ── Authenticated tenant endpoints ─────────────────────────────────────────

  @Get('my-products')
  @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
  @RequireFeature('api-marketplace')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List this tenant\'s marketplace products (Enterprise only)' })
  getMyProducts(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.marketplaceService.getTenantProducts(tenantId, query);
  }

  @Post('my-products')
  @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
  @RequireFeature('api-marketplace')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a product to the marketplace (Enterprise only)' })
  uploadProduct(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.marketplaceService.uploadProduct(tenantId, dto);
  }

  @Put('my-products/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
  @RequireFeature('api-marketplace')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a marketplace product (Enterprise only)' })
  updateProduct(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.marketplaceService.updateProduct(tenantId, id, dto);
  }

  @Delete('my-products/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, TierGuard)
  @RequireFeature('api-marketplace')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a product from marketplace (Enterprise only)' })
  deleteProduct(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.marketplaceService.deleteProduct(tenantId, id);
  }
}
