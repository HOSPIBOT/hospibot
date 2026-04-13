import { Controller, Get, Post, Body, Param, Headers, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly svc: SubscriptionService) {}

  /** GET /subscriptions/plans — public plan list with pricing */
  @Get('plans')
  getPlans() { return this.svc.getPlans(); }

  /** GET /subscriptions/current — current tenant subscription */
  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrent(@CurrentTenant() tenantId: string) { return this.svc.getSubscription(tenantId); }

  /**
   * POST /subscriptions/payment-link
   * Creates a Razorpay Payment Link for a plan upgrade.
   * Used for one-time payments or when subscription creation isn't available.
   */
  @Post('payment-link')
  @UseGuards(JwtAuthGuard)
  createPaymentLink(
    @CurrentTenant() tenantId: string,
    @Body() body: { plan: string; returnUrl: string },
  ) {
    return this.svc.createPaymentLink(tenantId, body.plan, body.returnUrl);
  }

  /**
   * POST /subscriptions/subscribe
   * Creates a Razorpay Subscription (recurring monthly billing).
   * Requires a Razorpay plan to be pre-created in dashboard.
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentTenant() tenantId: string,
    @Body() body: { plan: string; email: string },
  ) {
    return this.svc.createSubscription(tenantId, body.plan, body.email);
  }

  /** POST /subscriptions/cancel — cancel at period end */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentTenant() tenantId: string) { return this.svc.cancelSubscription(tenantId); }

  /**
   * POST /subscriptions/webhook/razorpay
   * Razorpay webhook — no auth, verified by signature.
   * Events handled: subscription.activated, subscription.charged,
   * subscription.cancelled, subscription.halted, payment_link.paid
   */
  @Post('webhook/razorpay')
  handleWebhook(
    @Body() payload: Buffer,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<any>,
  ) {
    const raw = req.rawBody?.toString('utf8') || JSON.stringify(payload);
    return this.svc.handleWebhook(raw, signature || '');
  }
}
