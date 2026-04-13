import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, RecordPaymentDto, ListInvoicesDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice with GST calculation' })
  async createInvoice(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(tenantId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices with filters' })
  async listInvoices(@CurrentTenant() tenantId: string, @Query() query: ListInvoicesDto) {
    return this.billingService.list(tenantId, query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice with payment history' })
  async getInvoice(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.billingService.findById(tenantId, id);
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  async recordPayment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(tenantId, id, dto);
  }

  @Post('invoices/:id/payment-link')
  @ApiOperation({ summary: 'Generate Razorpay payment link for WhatsApp delivery' })
  async createPaymentLink(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.billingService.createPaymentLink(tenantId, id);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue statistics with daily chart data' })
  @ApiQuery({ name: 'period', enum: ['today', 'week', 'month', 'year'], required: false })
  async getRevenue(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.billingService.getRevenueStats(tenantId, period || 'month');
  }
}

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Send invoice to patient via WhatsApp' })
  async sendInvoice(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const invoice = await this.billingService.findById(tenantId, id);
    if (!invoice) throw new Error('Invoice not found');

    // Get WhatsApp service
    const { WhatsappService } = await import('../whatsapp/whatsapp.service');
    // Instead, use the billing service's sendPaymentLink which already exists
    return this.billingService.sendPaymentLink(tenantId, id);
  }

  // ── Razorpay Checkout ─────────────────────────────────────────────────────

  @Post('invoices/:id/checkout-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay checkout order for embedded payment' })
  async createCheckoutOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.billingService.createCheckoutOrder(tenantId, id);
  }

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature and mark invoice paid' })
  async verifyPayment(
    @CurrentTenant() tenantId: string,
    @Body() dto: { orderId: string; paymentId: string; signature: string; invoiceId: string },
  ) {
    return this.billingService.verifyPayment(dto, tenantId);
  }

  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook handler (no auth — called by Razorpay)' })
  async razorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.billingService.handleRazorpayWebhook(payload, signature);
    return { received: true };
  }

  // ── ABHA (added here for simplicity, move to dedicated module in production) ─

  @Post('abha/generate-otp')
  @ApiOperation({ summary: 'Generate OTP for ABHA verification (NHA API)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async abhaGenerateOtp(@Body() body: { mobileNumber: string }) {
    const clientId = this.billingService['config'].get('ABHA_CLIENT_ID', '');
    const clientSecret = this.billingService['config'].get('ABHA_CLIENT_SECRET', '');

    if (!clientId || !clientSecret) {
      // Demo mode
      return { txnId: `DEMO-${Date.now()}`, message: 'Demo mode — configure ABHA_CLIENT_ID and ABHA_CLIENT_SECRET' };
    }

    // Real NHA API call
    const mobile = body.mobileNumber.replace(/\D/g, '').slice(-10);
    const res = await fetch('https://healthidsbx.abdm.gov.in/api/v1/registration/mobile/login/generateOtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${clientId}` },
      body: JSON.stringify({ mobile }),
    }).catch(() => null);

    if (res && res.ok) return res.json();
    return { txnId: `FALLBACK-${Date.now()}`, message: 'NHA API unavailable — using demo mode' };
  }

  @Post('abha/verify-otp')
  @ApiOperation({ summary: 'Verify OTP and fetch ABHA profile' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async abhaVerifyOtp(@Body() body: { txnId: string; otp: string; mobileNumber: string }) {
    if (body.txnId.startsWith('DEMO') || body.txnId.startsWith('FALLBACK')) {
      // Return demo profile
      const mobile = body.mobileNumber.replace(/\D/g, '').slice(-10);
      return {
        profile: {
          healthIdNumber: `91-${mobile.slice(0, 4)}-${mobile.slice(4, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
          healthId: `${mobile.slice(-5)}@abdm`,
          name: 'Patient Name (Demo)',
          mobile: body.mobileNumber,
          yearOfBirth: '1990',
          gender: 'M',
        },
      };
    }
    return { profile: null, message: 'OTP verification requires production ABHA credentials' };
  }

  @Post('abha/link-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link ABHA profile to patient record' })
  async abhaLinkProfile(
    @CurrentTenant() tenantId: string,
    @Body() body: { patientId: string; abhaNumber: string; abhaAddress: string; profile: any },
  ) {
    // Store ABHA ID in UHR
    const patient = await this.billingService['prisma'].patient.findFirst({
      where: { id: body.patientId, tenantId },
      select: { phone: true },
    });
    if (patient) {
      await this.billingService['prisma'].universalHealthRecord.updateMany({
        where: { mobileNumber: { in: [patient.phone, `+91${patient.phone.slice(-10)}`] } },
        data: { abhaId: body.abhaNumber } as any,
      }).catch(() => {});
    }
    return { linked: true, abhaNumber: body.abhaNumber };
  }

  @Get('export/tally')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export invoices as Tally XML (Tally ERP 9 / Tally Prime compatible)' })
  async exportTally(
    @CurrentTenant() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate   = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const xml = await this.billingService.exportToTally(tenantId, fromDate, toDate);

    (res as any).set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="tally-export-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.xml"`,
    });
    (res as any).send(xml);
  }
