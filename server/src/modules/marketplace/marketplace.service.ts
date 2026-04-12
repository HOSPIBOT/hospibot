import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private prisma: PrismaService) {}

  // ── List products (public) ────────────────────────────────────────────────

  async listProducts(filters: {
    search?: string; portalFamily?: string; category?: string;
    minPrice?: number; maxPrice?: number; homeDelivery?: boolean;
    featured?: boolean; page?: number; limit?: number;
  }) {
    const { page = 1, limit = 24 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isAvailable: true };
    if (filters.portalFamily) where.portalFamily = filters.portalFamily;
    if (filters.category) where.category = { contains: filters.category, mode: 'insensitive' };
    if (filters.homeDelivery) where.isHomeDelivery = true;
    if (filters.featured) where.featured = true;
    if (filters.minPrice) where.price = { gte: filters.minPrice * 100 };
    if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice * 100 };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.toLowerCase() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.marketplaceProduct.findMany({
        where, skip, take: +limit,
        orderBy: [{ featured: 'desc' }, { orderCount: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.marketplaceProduct.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Get single product ────────────────────────────────────────────────────

  async getProduct(id: string) {
    const product = await this.prisma.marketplaceProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // Increment view count
    await this.prisma.marketplaceProduct.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return product;
  }

  // ── Upload product (from any portal) ──────────────────────────────────────

  async uploadProduct(tenantId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, portalFamily: { select: { slug: true } } },
    });

    return this.prisma.marketplaceProduct.create({
      data: {
        tenantId,
        tenantName: tenant?.name || '',
        portalFamily: (tenant?.portalFamily as any)?.slug || dto.portalFamily || 'general',
        name: dto.name,
        description: dto.description,
        category: dto.category,
        subcategory: dto.subcategory,
        images: dto.images || [],
        tags: dto.tags || [],
        price: Math.round(dto.price * 100),
        mrp: dto.mrp ? Math.round(dto.mrp * 100) : undefined,
        priceUnit: dto.priceUnit || 'per unit',
        inStock: dto.inStock !== false,
        quantity: dto.quantity,
        isHomeDelivery: dto.isHomeDelivery || false,
        deliveryDays: dto.deliveryDays,
        specifications: dto.specifications || {},
        featured: dto.featured || false,
      },
    });
  }

  async updateProduct(tenantId: string, id: string, dto: any) {
    const product = await this.prisma.marketplaceProduct.findFirst({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = { ...dto };
    if (dto.price !== undefined) updateData.price = Math.round(dto.price * 100);
    if (dto.mrp !== undefined) updateData.mrp = Math.round(dto.mrp * 100);

    return this.prisma.marketplaceProduct.update({ where: { id }, data: updateData });
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.prisma.marketplaceProduct.update({ where: { id }, data: { isAvailable: false } });
    return { deleted: true };
  }

  async getTenantProducts(tenantId: string, filters: any) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.marketplaceProduct.findMany({
        where: { tenantId },
        skip, take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceProduct.count({ where: { tenantId } }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  async createOrder(dto: any) {
    const orderNumber = `MO-${Date.now().toString().slice(-10)}`;
    const items = dto.items as any[];
    const totalAmount = items.reduce((s, i) => s + (i.price * i.quantity), 0);

    // Increment order count for each product
    for (const item of items) {
      await this.prisma.marketplaceProduct.update({
        where: { id: item.productId },
        data: { orderCount: { increment: 1 } },
      }).catch(() => {});
    }

    return this.prisma.marketplaceOrder.create({
      data: {
        buyerTenantId: dto.buyerTenantId,
        buyerPhone:    dto.buyerPhone,
        buyerName:     dto.buyerName,
        buyerEmail:    dto.buyerEmail,
        buyerAddress:  dto.buyerAddress,
        buyerCity:     dto.buyerCity,
        buyerPincode:  dto.buyerPincode,
        orderNumber,
        items:         items.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, price: i.price })),
        totalAmount,
        notes:         dto.notes,
      },
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const [totalProducts, totalOrders, portalBreakdown, featuredProducts] = await Promise.all([
      this.prisma.marketplaceProduct.count({ where: { isAvailable: true } }),
      this.prisma.marketplaceOrder.count(),
      this.prisma.marketplaceProduct.groupBy({
        by: ['portalFamily'],
        where: { isAvailable: true },
        _count: true,
      }),
      this.prisma.marketplaceProduct.findMany({
        where: { isAvailable: true, featured: true },
        take: 6,
        orderBy: { orderCount: 'desc' },
      }),
    ]);

    return { totalProducts, totalOrders, portalBreakdown, featuredProducts };
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async getCategories() {
    const cats = await this.prisma.marketplaceProduct.groupBy({
      by: ['portalFamily', 'category'],
      where: { isAvailable: true },
      _count: true,
      orderBy: { portalFamily: 'asc' },
    });
    return cats;
  }
}
