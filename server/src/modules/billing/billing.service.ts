import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvoiceDto, RecordPaymentDto, ListInvoicesDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Generate sequential invoice number: INV-YYYYMM-0001
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let seq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      seq = lastSeq + 1;
    }

    return `${prefix}-${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate GST for invoice items
   */
  private calculateTotals(items: any[], discount: number = 0) {
    let subtotal = 0;
    let totalGst = 0;

    const processedItems = items.map(item => {
      const amount = item.qty * item.rate;
      const gstRate = item.gstRate || 0;
      const gstAmount = Math.round(amount * gstRate / 100);

      subtotal += amount;
      totalGst += gstAmount;

      return {
        ...item,
        amount,
        gstAmount,
      };
    });

    const totalAmount = subtotal + totalGst - discount;

    return {
      items: processedItems,
      subtotal,
      gstAmount: totalGst,
      discount,
      totalAmount,
      dueAmount: totalAmount,
    };
  }

  async createInvoice(tenantId: string, dto: CreateInvoiceDto) {
    // Verify patient
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const totals = this.calculateTotals(dto.items, dto.discount || 0);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        visitId: dto.visitId,
        invoiceNumber,
        items: totals.items,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        discount: totals.discount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        dueAmount: totals.dueAmount,
        status: 'SENT',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, healthId: true } },
      },
    });

    return invoice;
  }

  async findById(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, healthId: true, email: true, address: true, city: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        visit: {
          select: { id: true, chiefComplaint: true, diagnosisText: true, createdAt: true,
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async list(tenantId: string, query: ListInvoicesDto) {
    const { page = 1, limit = 20, patientId, status, fromDate, toDate, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true, phone: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(tenantId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status === 'CANCELLED' || invoice.status === 'REFUNDED') {
      throw new BadRequestException('Cannot record payment on a cancelled or refunded invoice');
    }

    if (dto.amount > invoice.dueAmount) {
      throw new BadRequestException(`Payment amount (${dto.amount}) exceeds due amount (${invoice.dueAmount})`);
    }

    // Create payment and update invoice in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount: dto.amount,
          method: dto.method,
          status: 'SUCCESS',
          gatewayOrderId: dto.gatewayOrderId,
          gatewayPaymentId: dto.gatewayPaymentId,
          gatewaySignature: dto.gatewaySignature,
          paidAt: new Date(),
        },
      });

      const newPaidAmount = invoice.paidAmount + dto.amount;
      const newDueAmount = invoice.totalAmount - newPaidAmount;
      const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(0, newDueAmount),
          status: newStatus,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return result;
  }

  /**
   * Create Razorpay payment link for WhatsApp delivery
   */
  async createPaymentLink(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { patient: { select: { firstName: true, lastName: true, phone: true, email: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.dueAmount <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const keyId = this.config.get('RAZORPAY_KEY_ID');
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      // Return a mock link for development
      return {
        paymentLink: `https://rzp.io/mock/${invoiceId}`,
        amount: invoice.dueAmount,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Razorpay not configured. This is a mock payment link.',
      };
    }

    // In production, use Razorpay SDK to create payment link
    // const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    // const link = await razorpay.paymentLink.create({...});

    return {
      paymentLink: `https://rzp.io/i/${invoiceId}`,
      amount: invoice.dueAmount,
      invoiceNumber: invoice.invoiceNumber,
      patientName: `${invoice.patient.firstName} ${invoice.patient.lastName || ''}`.trim(),
      patientPhone: invoice.patient.phone,
    };
  }

  /**
   * Revenue statistics for dashboard
   */
  async getRevenueStats(tenantId: string, period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now); startDate.setHours(0, 0, 0, 0); break;
      case 'week':
        startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    const [totalRevenue, totalCollected, totalDue, invoiceCount, paidCount] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { tenantId, createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        _sum: { paidAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, createdAt: { gte: startDate }, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { dueAmount: true },
      }),
      this.prisma.invoice.count({
        where: { tenantId, createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.invoice.count({
        where: { tenantId, createdAt: { gte: startDate }, status: 'PAID' },
      }),
    ]);

    // Daily revenue for chart (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const dailyPayments = await this.prisma.payment.findMany({
      where: { tenantId, status: 'SUCCESS', paidAt: { gte: thirtyDaysAgo } },
      select: { amount: true, paidAt: true },
    });

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    dailyPayments.forEach(p => {
      const dateKey = p.paidAt!.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + p.amount;
    });

    return {
      period,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCollected: totalCollected._sum.paidAmount || 0,
      totalDue: totalDue._sum.dueAmount || 0,
      invoiceCount,
      paidCount,
      collectionRate: invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100) : 0,
      dailyRevenue: Object.entries(dailyRevenue)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
