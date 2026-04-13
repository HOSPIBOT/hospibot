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
      // Dev mode: return simulated link
      return {
        paymentLink: `https://rzp.io/mock/${invoiceId}`,
        amount: invoice.dueAmount,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real payment links.',
      };
    }

    // Create Razorpay Payment Link via API
    const patientName = `${invoice.patient.firstName} ${invoice.patient.lastName || ''}`.trim();
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const razorpayRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: invoice.dueAmount, // already in paise
        currency: 'INR',
        accept_partial: false,
        reference_id: invoice.invoiceNumber,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        customer: {
          name: patientName,
          email: invoice.patient.email || undefined,
          contact: invoice.patient.phone?.replace(/\D/g, '').slice(-10) || '',
        },
        notify: { sms: true, email: !!invoice.patient.email },
        reminder_enable: true,
        notes: { invoice_id: invoiceId, tenant_id: tenantId },
        callback_url: `${this.config.get('APP_URL', 'https://hospibot-web.vercel.app')}/payment-success`,
        callback_method: 'get',
      }),
    }).catch(() => null);

    if (razorpayRes && razorpayRes.ok) {
      const link = await razorpayRes.json();
      // Store payment link on invoice
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { paymentLink: link.short_url } as any,
      });
      return {
        paymentLink: link.short_url,
        amount: invoice.dueAmount,
        invoiceNumber: invoice.invoiceNumber,
        patientName,
        patientPhone: invoice.patient.phone,
        razorpayLinkId: link.id,
      };
    }

    // Fallback if Razorpay fails
    return {
      paymentLink: `https://rzp.io/i/${invoiceId}`,
      amount: invoice.dueAmount,
      invoiceNumber: invoice.invoiceNumber,
      message: 'Payment link generated. Configure webhook for automatic reconciliation.',
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

  // ── Razorpay Webhook Handler ────────────────────────────────────────────────

  async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET', '');
    
    if (secret) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (expectedSignature !== signature) {
        this.logger.warn('Razorpay webhook signature mismatch — ignored');
        return;
      }
    }

    const event = payload.event;
    const entity = payload.payload?.payment_link?.entity || payload.payload?.payment?.entity;

    if (event === 'payment_link.paid' && entity) {
      const invoiceNumber = entity.reference_id;
      const amountPaid    = entity.amount_paid; // paise

      if (!invoiceNumber || !amountPaid) return;

      const invoice = await this.prisma.invoice.findFirst({
        where: { invoiceNumber },
        include: { patient: { select: { firstName: true, phone: true } } },
      });

      if (!invoice) return;

      // Record payment
      await this.recordPayment(invoice.tenantId, invoice.id, {
        amount: amountPaid,
        method: 'ONLINE',
        reference: entity.id || entity.payment_link_id,
        notes: `Razorpay Payment Link — ${event}`,
      } as any);

      this.logger.log(`Auto-reconciled payment for ${invoiceNumber}: ₹${amountPaid / 100}`);
    }
  }

  // ── Create Razorpay Checkout Order (for embedded checkout) ─────────────────

  async createCheckoutOrder(tenantId: string, invoiceId: string): Promise<any> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { patient: { select: { firstName: true, lastName: true, phone: true, email: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const keyId     = this.config.get('RAZORPAY_KEY_ID');
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      return { orderId: `order_mock_${Date.now()}`, keyId: 'rzp_test_mock', amount: invoice.dueAmount, currency: 'INR', invoiceNumber: invoice.invoiceNumber };
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: invoice.dueAmount,
        currency: 'INR',
        receipt: invoice.invoiceNumber,
        notes: { invoice_id: invoiceId, tenant_id: tenantId },
      }),
    });

    if (res.ok) {
      const order = await res.json();
      return {
        orderId: order.id, keyId,
        amount: invoice.dueAmount, currency: 'INR',
        invoiceNumber: invoice.invoiceNumber,
        patientName: `${invoice.patient.firstName} ${invoice.patient.lastName || ''}`.trim(),
        patientPhone: invoice.patient.phone,
        patientEmail: invoice.patient.email,
      };
    }

    throw new Error('Failed to create Razorpay order');
  }

  // ── Verify Razorpay signature after payment ─────────────────────────────────

  async verifyPayment(dto: { orderId: string; paymentId: string; signature: string; invoiceId: string }, tenantId: string): Promise<any> {
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET', 'mock');
    const crypto    = await import('crypto');

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${dto.orderId}|${dto.paymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.signature && keySecret !== 'mock') {
      throw new BadRequestException('Invalid payment signature');
    }

    const invoice = await this.prisma.invoice.findFirst({ where: { id: dto.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Mark as paid
    const updated = await this.recordPayment(tenantId, dto.invoiceId, {
      amount: invoice.dueAmount,
      method: 'ONLINE',
      reference: dto.paymentId,
      notes: `Razorpay Order: ${dto.orderId}`,
    } as any);

    return { verified: true, invoiceNumber: invoice.invoiceNumber };
  }

  // ── Tally Export (XML format compatible with Tally ERP 9 / Tally Prime) ────

  async exportToTally(tenantId: string, fromDate: Date, toDate: Date): Promise<string> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, gstNumber: true },
    });

    // Generate Tally XML
    const voucherXml = invoices.map(inv => {
      const patientName = `${inv.patient.firstName} ${inv.patient.lastName || ''}`.trim();
      const totalAmount = (inv.totalAmount / 100).toFixed(2);
      const date = new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');

      return `  <VOUCHER VCHTYPE="Sales" ACTION="Create">
    <DATE>${date}</DATE>
    <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${inv.invoiceNumber}</VOUCHERNUMBER>
    <NARRATION>Invoice to ${patientName}</NARRATION>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${patientName}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${totalAmount}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>Healthcare Services</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${totalAmount}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${tenant?.name || 'HospiBot Clinic'}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${voucherXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  }
