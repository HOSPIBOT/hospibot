import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { createHmac } from 'crypto';

const PLAN_WALLET_ALLOCATION: Record<string, { wa: number; sms: number; storageGb: number }> = {
  STARTER:      { wa: 500,   sms: 500,   storageGb: 2  },
  GROWTH:       { wa: 2000,  sms: 2000,  storageGb: 10 },
  PROFESSIONAL: { wa: 10000, sms: 5000,  storageGb: 50 },
  ENTERPRISE:   { wa: 50000, sms: 20000, storageGb: 200 },
};

const DEFAULT_RECHARGE_PACKS = [
  // WhatsApp
  { packType: 'WHATSAPP', name: '500 WA Credits',   creditsOrUnits: 500,   priceInclGst: 59000,  priceExclGst: 50000,  sortOrder: 1 },
  { packType: 'WHATSAPP', name: '2,000 WA Credits',  creditsOrUnits: 2000,  priceInclGst: 199000, priceExclGst: 168644, sortOrder: 2 },
  { packType: 'WHATSAPP', name: '10,000 WA Credits', creditsOrUnits: 10000, priceInclGst: 799000, priceExclGst: 677966, sortOrder: 3 },
  // SMS
  { packType: 'SMS', name: '500 SMS',    creditsOrUnits: 500,   priceInclGst: 29000,  priceExclGst: 24576,  sortOrder: 1 },
  { packType: 'SMS', name: '2,000 SMS',  creditsOrUnits: 2000,  priceInclGst: 99000,  priceExclGst: 83898,  sortOrder: 2 },
  { packType: 'SMS', name: '10,000 SMS', creditsOrUnits: 10000, priceInclGst: 399000, priceExclGst: 338136, sortOrder: 3 },
  // Storage
  { packType: 'STORAGE', name: '10 GB',  creditsOrUnits: 10,  priceInclGst: 59000,  priceExclGst: 50000,  sortOrder: 1 },
  { packType: 'STORAGE', name: '50 GB',  creditsOrUnits: 50,  priceInclGst: 199000, priceExclGst: 168644, sortOrder: 2 },
  { packType: 'STORAGE', name: '200 GB', creditsOrUnits: 200, priceInclGst: 599000, priceExclGst: 507627, sortOrder: 3 },
];

@Injectable()
export class DiagnosticBillingService {
  private readonly logger = new Logger(DiagnosticBillingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get rzpAuth() {
    const k = this.config.get('RAZORPAY_KEY_ID', '');
    const s = this.config.get('RAZORPAY_KEY_SECRET', '');
    return Buffer.from(`${k}:${s}`).toString('base64');
  }

  private async rzp(method: 'GET' | 'POST', path: string, body?: any) {
    const r = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method,
      headers: { Authorization: `Basic ${this.rzpAuth}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const d = await r.json() as any;
    if (!r.ok) throw new BadRequestException(d?.error?.description || 'Razorpay error');
    return d;
  }

  // ── Ensure wallet exists for tenant ───────────────────────────────────────

  async ensureWallet(tenantId: string): Promise<any> {
    return this.prisma.tenantWallet.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  // ── Seed wallet on plan activation ────────────────────────────────────────

  async seedWalletForPlan(tenantId: string, plan: string) {
    const alloc = PLAN_WALLET_ALLOCATION[plan] ?? PLAN_WALLET_ALLOCATION.STARTER;
    await this.ensureWallet(tenantId);
    await this.prisma.tenantWallet.update({
      where: { tenantId },
      data: {
        waCredits: { increment: alloc.wa },
        smsCredits: { increment: alloc.sms },
        storageGbPurchased: { increment: alloc.storageGb },
      },
    });
    // Record credit transactions
    const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
    if (!wallet) return;
    await this.prisma.walletTransaction.create({
      data: {
        tenantId, walletId: wallet.id,
        walletType: 'WHATSAPP',
        txType: 'CREDIT_PLAN_ALLOCATION',
        amount: alloc.wa, balanceBefore: 0, balanceAfter: alloc.wa,
        description: `Plan ${plan} — WA credits allocated`,
      },
    });
    this.logger.log(`Wallet seeded for tenant ${tenantId} plan ${plan}: ${alloc.wa} WA credits`);
  }

  // ── Create Razorpay recharge order ────────────────────────────────────────

  async createRechargeOrder(tenantId: string, packId: string) {
    const pack = await this.prisma.rechargePack.findUnique({ where: { id: packId } });
    if (!pack) throw new NotFoundException('Recharge pack not found');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, email: true },
    });

    let rzpOrderId: string;
    let rzpOrder: any;

    const isRzpConfigured = !!this.config.get('RAZORPAY_KEY_ID');

    if (isRzpConfigured) {
      rzpOrder = await this.rzp('POST', 'orders', {
        amount: pack.priceInclGst,
        currency: 'INR',
        receipt: `DIAG-${tenantId.slice(0, 8)}-${Date.now()}`,
        notes: { tenantId, packId, packType: pack.packType },
      });
      rzpOrderId = rzpOrder.id;
    } else {
      // Demo mode — generate fake order ID
      rzpOrderId = `order_demo_${Date.now()}`;
    }

    // Save payment record
    const payment = await this.prisma.razorpayPayment.create({
      data: {
        tenantId, razorpayOrderId: rzpOrderId,
        amountPaise: pack.priceInclGst,
        packId, walletType: pack.packType as any,
        status: 'CREATED',
      },
    });

    return {
      orderId: rzpOrderId,
      amount: pack.priceInclGst,
      currency: 'INR',
      keyId: this.config.get('RAZORPAY_KEY_ID', 'rzp_test_demo'),
      tenantName: tenant?.name,
      tenantEmail: tenant?.email,
      pack: { name: pack.name, creditsOrUnits: pack.creditsOrUnits, packType: pack.packType },
      paymentRecordId: payment.id,
    };
  }

  // ── Verify Razorpay payment and credit wallet ─────────────────────────────

  async verifyPayment(tenantId: string, dto: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // Verify signature
    const isRzpConfigured = !!this.config.get('RAZORPAY_KEY_SECRET');
    if (isRzpConfigured) {
      const expectedSig = createHmac('sha256', this.config.get('RAZORPAY_KEY_SECRET', ''))
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');
      if (expectedSig !== dto.razorpaySignature) {
        throw new BadRequestException('Invalid payment signature — possible tampered request');
      }
    }

    // Find our payment record
    const payment = await this.prisma.razorpayPayment.findFirst({
      where: { tenantId, razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'CAPTURED') {
      return { success: true, alreadyProcessed: true };
    }

    // Find pack
    const pack = await this.prisma.rechargePack.findUnique({ where: { id: payment.packId! } });
    if (!pack) throw new NotFoundException('Pack not found');

    // Update payment record
    await this.prisma.razorpayPayment.update({
      where: { id: payment.id },
      data: { razorpayPaymentId: dto.razorpayPaymentId, razorpaySignature: dto.razorpaySignature, status: 'CAPTURED' },
    });

    // Credit the wallet
    await this.creditWallet(tenantId, pack, payment);

    // Generate invoice
    const invoice = await this.generateInvoice(tenantId, pack, payment);

    return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  }

  // ── Handle Razorpay webhook ───────────────────────────────────────────────

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret = this.config.get('RAZORPAY_WEBHOOK_SECRET', '');
    if (webhookSecret) {
      const expectedSig = createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (expectedSig !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = payload.event;
    this.logger.log(`Razorpay webhook: ${event}`);

    if (event === 'payment.captured') {
      const p = payload.payload.payment.entity;
      const notes = p.notes || {};
      const { tenantId, packId } = notes;
      if (!tenantId || !packId) return { ok: true };

      // Find existing payment record by order_id
      const existing = await this.prisma.razorpayPayment.findFirst({
        where: { tenantId, razorpayOrderId: p.order_id },
      });
      if (!existing || existing.status === 'CAPTURED') return { ok: true };

      const pack = await this.prisma.rechargePack.findUnique({ where: { id: packId } });
      if (!pack) return { ok: true };

      await this.prisma.razorpayPayment.update({
        where: { id: existing.id },
        data: { razorpayPaymentId: p.id, status: 'CAPTURED' },
      });
      await this.creditWallet(tenantId, pack, existing);
      await this.generateInvoice(tenantId, pack, existing);
    }

    if (event === 'payment.failed') {
      const p = payload.payload.payment.entity;
      await this.prisma.razorpayPayment.updateMany({
        where: { razorpayOrderId: p.order_id, status: 'CREATED' },
        data: { status: 'FAILED', failureReason: p.error_description },
      });
    }

    return { ok: true };
  }

  // ── Auto-recharge trigger ─────────────────────────────────────────────────

  async checkAndAutoRecharge(tenantId: string, walletType: 'WHATSAPP' | 'SMS' | 'STORAGE') {
    const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
    if (!wallet) return;

    let shouldRecharge = false;
    if (walletType === 'WHATSAPP' && wallet.autoRechargeWaEnabled) {
      shouldRecharge = wallet.waCredits < wallet.autoRechargeWaThreshold;
    }

    if (!shouldRecharge || !wallet.autoRechargeWaPackId) return;
    if (!wallet.autoRechargePmId) return; // Need saved payment method

    try {
      const order = await this.createRechargeOrder(tenantId, wallet.autoRechargeWaPackId);
      this.logger.log(`Auto-recharge triggered for tenant ${tenantId}: ${order.orderId}`);
      // In production: charge saved UPI mandate via Razorpay emandate
    } catch (err: any) {
      this.logger.error(`Auto-recharge failed for ${tenantId}: ${err.message}`);
    }
  }

  // ── Seed default recharge packs (called once during setup) ───────────────

  async seedRechargePacks() {
    let seeded = 0;
    for (const pack of DEFAULT_RECHARGE_PACKS) {
      const exists = await this.prisma.rechargePack.findFirst({
        where: { packType: pack.packType as any, name: pack.name },
      });
      if (!exists) {
        await this.prisma.rechargePack.create({ data: { ...pack, gstRate: 0.18 } as any });
        seeded++;
      }
    }
    return { seeded };
  }

  // ── Get auto-recharge config ──────────────────────────────────────────────

  async getAutoRechargeConfig(tenantId: string) {
    const wallet = await this.ensureWallet(tenantId);
    return {
      wa: {
        enabled: wallet.autoRechargeWaEnabled,
        threshold: wallet.autoRechargeWaThreshold,
        packId: wallet.autoRechargeWaPackId,
      },
    };
  }

  async setAutoRechargeConfig(tenantId: string, dto: {
    walletType: string; enabled: boolean; threshold?: number; packId?: string;
  }) {
    const data: any = {};
    if (dto.walletType === 'WHATSAPP') {
      data.autoRechargeWaEnabled = dto.enabled;
      if (dto.threshold !== undefined) data.autoRechargeWaThreshold = dto.threshold;
      if (dto.packId) data.autoRechargeWaPackId = dto.packId;
    }
    return this.prisma.tenantWallet.update({ where: { tenantId }, data });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async creditWallet(tenantId: string, pack: any, payment: any) {
    const wallet = await this.ensureWallet(tenantId);
    const before = pack.packType === 'WHATSAPP' ? wallet.waCredits
      : pack.packType === 'SMS' ? wallet.smsCredits
      : wallet.storageGbPurchased;

    const updateData: any = {};
    if (pack.packType === 'WHATSAPP') updateData.waCredits = { increment: pack.creditsOrUnits };
    else if (pack.packType === 'SMS') updateData.smsCredits = { increment: pack.creditsOrUnits };
    else if (pack.packType === 'STORAGE') updateData.storageGbPurchased = { increment: pack.creditsOrUnits };

    await this.prisma.tenantWallet.update({ where: { tenantId }, data: updateData });

    // Record transaction
    await this.prisma.walletTransaction.create({
      data: {
        tenantId, walletId: wallet.id,
        walletType: pack.packType as any,
        txType: 'CREDIT_TOPUP',
        amount: pack.creditsOrUnits,
        balanceBefore: before,
        balanceAfter: before + pack.creditsOrUnits,
        referenceType: 'razorpay_payment',
        referenceId: payment.razorpayPaymentId,
        description: `Recharge: ${pack.name}`,
      },
    });

    this.logger.log(`Wallet credited: ${tenantId} +${pack.creditsOrUnits} ${pack.packType}`);
  }

  private async generateInvoice(tenantId: string, pack: any, payment: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, gstNumber: true },
    });

    const now = new Date();
    const prefix = `HB-INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const last = await this.prisma.hospibotInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });
    const seq = last ? parseInt(last.invoiceNumber.split('-').pop() || '0') + 1 : 1;
    const invoiceNumber = `${prefix}-${seq.toString().padStart(4, '0')}`;

    return this.prisma.hospibotInvoice.create({
      data: {
        tenantId, invoiceNumber,
        invoiceType: `${pack.packType}_TOPUP`,
        lineItems: [{ description: pack.name, qty: 1, rate: pack.priceExclGst, gstRate: 18 }],
        subtotalPaise: pack.priceExclGst,
        gstPaise: pack.priceInclGst - pack.priceExclGst,
        totalPaise: pack.priceInclGst,
        hospibotGstin: this.config.get('HOSPIBOT_GSTIN', ''),
        tenantGstin: tenant?.gstNumber,
        paidAt: new Date(),
        paymentId: payment.razorpayPaymentId,
      },
    });
  }
}
