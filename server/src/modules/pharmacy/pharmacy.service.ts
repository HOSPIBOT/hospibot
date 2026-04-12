import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

// ── Default drug categories ────────────────────────────────────────────────────
const DRUG_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Patch', 'Suppository', 'Sachet'];
const CATEGORIES = ['Analgesic', 'Antibiotic', 'Antifungal', 'Antiviral', 'Antacid', 'Antihistamine', 'Antidiabetic', 'Antihypertensive', 'Cardiovascular', 'Dermatology', 'ENT', 'Gastrointestinal', 'Hormonal', 'Multivitamin', 'Neurological', 'Ophthalmic', 'Respiratory', 'Surgical', 'Vaccines', 'General'];

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ── Product Catalogue ──────────────────────────────────────────────────────

  async listProducts(tenantId: string, filters: any) {
    const { search, category, lowStock, page = 1, limit = 30 } = filters;
    const skip = (page - 1) * limit;
    const where: any = { tenantId, isActive: true };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { composition: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (lowStock === 'true') {
      where.currentStock = { lte: this.prisma.$queryRaw`minimum_stock` };
    }

    const [data, total] = await Promise.all([
      this.prisma.pharmacyProduct.findMany({
        where, skip, take: +limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: {
          batches: {
            where: { remaining: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.pharmacyProduct.count({ where }),
    ]);

    // Mark low stock items
    const enriched = data.map(p => ({
      ...p,
      isLowStock: p.currentStock <= p.minimumStock,
      nearestExpiry: p.batches[0]?.expiryDate || null,
      isNearExpiry: p.batches[0] ? this.isWithin90Days(p.batches[0].expiryDate) : false,
    }));

    return { data: enriched, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createProduct(tenantId: string, dto: any) {
    return this.prisma.pharmacyProduct.create({
      data: {
        tenantId,
        name: dto.name,
        genericName: dto.genericName,
        manufacturer: dto.manufacturer,
        category: dto.category || 'General',
        composition: dto.composition,
        strength: dto.strength,
        form: dto.form || 'Tablet',
        schedule: dto.schedule,
        mrp: Math.round((dto.mrp || 0) * 100),
        costPrice: Math.round((dto.costPrice || 0) * 100),
        sellingPrice: Math.round((dto.sellingPrice || dto.mrp || 0) * 100),
        gstRate: dto.gstRate || 12,
        minimumStock: dto.minimumStock || 10,
        unit: dto.unit || 'Strip',
        unitsPerPack: dto.unitsPerPack || 10,
        storageCondition: dto.storageCondition,
        requiresPrescription: dto.requiresPrescription || false,
        isControlledSubstance: dto.isControlledSubstance || false,
      },
    });
  }

  async updateProduct(tenantId: string, id: string, dto: any) {
    const product = await this.prisma.pharmacyProduct.findFirst({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = { ...dto };
    if (dto.mrp !== undefined) updateData.mrp = Math.round(dto.mrp * 100);
    if (dto.costPrice !== undefined) updateData.costPrice = Math.round(dto.costPrice * 100);
    if (dto.sellingPrice !== undefined) updateData.sellingPrice = Math.round(dto.sellingPrice * 100);

    return this.prisma.pharmacyProduct.update({ where: { id }, data: updateData });
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.prisma.pharmacyProduct.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  // ── Batch / Stock Management ───────────────────────────────────────────────

  async addBatch(tenantId: string, productId: string, dto: any) {
    const product = await this.prisma.pharmacyProduct.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');

    const batch = await this.prisma.pharmacyBatch.create({
      data: {
        tenantId,
        productId,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        quantity: dto.quantity,
        remaining: dto.quantity,
        costPrice: Math.round((dto.costPrice || 0) * 100),
        sellingPrice: Math.round((dto.sellingPrice || product.sellingPrice / 100) * 100),
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
      },
    });

    // Update current stock
    await this.prisma.pharmacyProduct.update({
      where: { id: productId },
      data: { currentStock: { increment: dto.quantity } },
    });

    return batch;
  }

  async getInventoryAlerts(tenantId: string) {
    const thirtyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [lowStock, nearExpiry, outOfStock] = await Promise.all([
      // Low stock (above 0 but below minimum)
      this.prisma.pharmacyProduct.findMany({
        where: {
          tenantId, isActive: true,
          currentStock: { gt: 0, lte: 10 },
        },
        orderBy: { currentStock: 'asc' },
        take: 20,
      }),

      // Expiring within 90 days
      this.prisma.pharmacyBatch.findMany({
        where: {
          tenantId,
          remaining: { gt: 0 },
          expiryDate: { lte: thirtyDaysFromNow, gte: new Date() },
        },
        include: { product: { select: { name: true, form: true, strength: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 20,
      }),

      // Out of stock
      this.prisma.pharmacyProduct.findMany({
        where: { tenantId, isActive: true, currentStock: 0 },
        orderBy: { name: 'asc' },
        take: 20,
      }),
    ]);

    return { lowStock, nearExpiry, outOfStock };
  }

  // ── Dashboard Stats ────────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today.getTime() + 86399999);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts, lowStockCount, expiringCount, outOfStockCount,
      todayOrders, todayRevenue,
    ] = await Promise.all([
      this.prisma.pharmacyProduct.count({ where: { tenantId, isActive: true } }),
      this.prisma.pharmacyProduct.count({ where: { tenantId, isActive: true, currentStock: { gt: 0, lte: 10 } } }),
      this.prisma.pharmacyBatch.count({ where: { tenantId, remaining: { gt: 0 }, expiryDate: { lte: thirtyDaysFromNow, gte: new Date() } } }),
      this.prisma.pharmacyProduct.count({ where: { tenantId, isActive: true, currentStock: 0 } }),
      this.prisma.dispensingOrder.count({ where: { tenantId, createdAt: { gte: today, lte: todayEnd } } }),
      this.prisma.dispensingOrder.aggregate({ where: { tenantId, createdAt: { gte: today, lte: todayEnd }, status: 'DISPENSED' }, _sum: { billAmount: true } }),
    ]);

    return { totalProducts, lowStockCount, expiringCount, outOfStockCount, todayOrders, todayRevenue: todayRevenue._sum.billAmount || 0 };
  }

  // ── Dispensing ─────────────────────────────────────────────────────────────

  async listDispensing(tenantId: string, filters: any) {
    const { page = 1, limit = 20, status, search } = filters;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dispensingOrder.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true, phone: true } },
          items: { include: { product: { select: { name: true, form: true, strength: true, unit: true } } } },
        },
      }),
      this.prisma.dispensingOrder.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createDispensingOrder(tenantId: string, dto: any) {
    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId, deletedAt: null } });
    if (!patient) throw new NotFoundException('Patient not found');

    const orderNumber = `PH-${Date.now().toString().slice(-8)}`;
    let totalAmount = 0;
    let gstAmount = 0;

    // Validate and calculate items
    const processedItems: any[] = [];
    for (const item of dto.items) {
      const product = await this.prisma.pharmacyProduct.findFirst({ where: { id: item.productId, tenantId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (product.currentStock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
      }

      const unitPrice = product.sellingPrice;
      const itemTotal = unitPrice * item.quantity;
      const itemGst   = Math.round(itemTotal * product.gstRate / 100);

      totalAmount += itemTotal;
      gstAmount   += itemGst;

      processedItems.push({
        productId: item.productId,
        quantity:  item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        gstRate:    product.gstRate,
        gstAmount:  itemGst,
      });
    }

    const discount   = dto.discountAmount || 0;
    const billAmount = totalAmount + gstAmount - discount;

    // Create order + items in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispensingOrder.create({
        data: {
          tenantId,
          patientId:      dto.patientId,
          prescriptionId: dto.prescriptionId,
          orderNumber,
          totalAmount,
          gstAmount,
          discountAmount: discount,
          billAmount,
          notes:          dto.notes,
          status:         'PENDING',
          items:          { create: processedItems },
        },
        include: {
          patient: { select: { firstName: true, phone: true } },
          items: true,
        },
      });

      // Deduct stock
      for (const item of processedItems) {
        await tx.pharmacyProduct.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return order;
  }

  async dispenseOrder(tenantId: string, id: string) {
    const order = await this.prisma.dispensingOrder.findFirst({
      where: { id, tenantId },
      include: { patient: { select: { firstName: true, phone: true } }, items: { include: { product: { select: { name: true, form: true } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'DISPENSED') throw new BadRequestException('Already dispensed');

    await this.prisma.dispensingOrder.update({
      where: { id },
      data: { status: 'DISPENSED', dispensedAt: new Date(), paymentStatus: 'PAID' },
    });

    // Send WhatsApp receipt
    const itemList = order.items.map(i => `• ${i.product.name} ${i.product.form} × ${i.quantity}`).join('\n');
    await this.whatsappService.sendTextMessage(
      tenantId,
      order.patient.phone,
      `💊 *Medicines Dispensed*\n\nHi ${order.patient.firstName},\n\n${itemList}\n\n*Total: ₹${(order.billAmount / 100).toFixed(2)}*\n\nThank you for choosing our pharmacy. Take your medicines as prescribed by your doctor.\n\nGet well soon! 💙`
    ).catch(() => {});

    return { dispensed: true, orderNumber: order.orderNumber };
  }

  // ── Suppliers ──────────────────────────────────────────────────────────────

  async listSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, dto: any) {
    return this.prisma.supplier.create({ data: { tenantId, ...dto } });
  }

  async updateSupplier(tenantId: string, id: string, dto: any) {
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────

  async listPurchaseOrders(tenantId: string, filters: any) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true, phone: true } } },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createPurchaseOrder(tenantId: string, dto: any) {
    const orderNumber = `PO-${Date.now().toString().slice(-8)}`;
    const totalAmount = (dto.items as any[]).reduce((s: number, i: any) => s + (i.totalCost || i.quantity * i.unitCost || 0), 0);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId:  dto.supplierId,
        orderNumber,
        items:        dto.items,
        totalAmount:  Math.round(totalAmount * 100),
        notes:        dto.notes,
        expectedAt:   dto.expectedAt ? new Date(dto.expectedAt) : undefined,
        status:       'DRAFT',
      },
      include: { supplier: { select: { name: true } } },
    });
  }

  async receivePurchaseOrder(tenantId: string, id: string, receivedItems: any[]) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    // Add batches for each received item and update stock
    for (const item of receivedItems) {
      if (!item.productId || !item.quantity) continue;

      // Add batch record
      await this.prisma.pharmacyBatch.create({
        data: {
          tenantId,
          productId:       item.productId,
          batchNumber:     item.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
          expiryDate:      new Date(item.expiryDate),
          quantity:        item.quantity,
          remaining:       item.quantity,
          costPrice:       Math.round((item.costPrice || 0) * 100),
          sellingPrice:    Math.round((item.sellingPrice || 0) * 100),
          supplierId:      po.supplierId,
          purchaseOrderId: id,
        },
      });

      // Increment stock
      await this.prisma.pharmacyProduct.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      });
    }

    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
    });

    return { received: true };
  }

  // ── Revenue Trend ──────────────────────────────────────────────────────────

  async getRevenueTrend(tenantId: string, days = 14) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const orders = await this.prisma.dispensingOrder.findMany({
      where: { tenantId, createdAt: { gte: from }, status: 'DISPENSED' },
      select: { createdAt: true, billAmount: true },
    });

    const byDate: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      byDate[key] = { date: key, revenue: 0, orders: 0 };
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (byDate[key]) {
        byDate[key].revenue += o.billAmount;
        byDate[key].orders++;
      }
    }

    return Object.values(byDate);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private isWithin90Days(date: Date): boolean {
    const diffMs = date.getTime() - Date.now();
    return diffMs > 0 && diffMs < 90 * 24 * 60 * 60 * 1000;
  }

  getMetadata() {
    return { forms: DRUG_FORMS, categories: CATEGORIES };
  }
}
