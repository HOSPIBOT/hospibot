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
