import { Controller, Get, Post, Body, Param, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrent(@CurrentTenant() tenantId: string) {
    return this.subscriptionService.getSubscription(tenantId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @CurrentTenant() tenantId: string,
    @Body() body: { plan: string; returnUrl: string },
  ) {
    return this.subscriptionService.createCheckoutSession(tenantId, body.plan, body.returnUrl);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentTenant() tenantId: string) {
    return this.subscriptionService.cancelSubscription(tenantId);
  }

  @Post('webhook/stripe')
  handleWebhook(
    @Body() payload: Buffer,
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<any>,
  ) {
    const raw = req.rawBody?.toString('utf8') || JSON.stringify(payload);
    return this.subscriptionService.handleStripeWebhook(raw, signature || '');
  }
}
