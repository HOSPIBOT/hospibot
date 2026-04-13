import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

const PLANS = {
  STARTER:      { price: 4900,  maxUsers: 5,  maxBranches: 1,  stripePriceId: 'price_starter_monthly'      },
  GROWTH:       { price: 9900,  maxUsers: 15, maxBranches: 2,  stripePriceId: 'price_growth_monthly'       },
  PROFESSIONAL: { price: 19900, maxUsers: 50, maxBranches: 5,  stripePriceId: 'price_professional_monthly' },
  ENTERPRISE:   { price: 49900, maxUsers: -1, maxBranches: -1, stripePriceId: 'price_enterprise_monthly'   },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ── Get subscription info for a tenant ────────────────────────────────────
  async getSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, plan: true, status: true, settings: true },
    });
    if (!tenant) throw new Error('Tenant not found');

    const plan = PLANS[(tenant.plan as keyof typeof PLANS)] || PLANS.STARTER;
    const settings: any = tenant.settings || {};

    return {
      tenantId,
      plan: tenant.plan,
      status: tenant.status,
      price: plan.price,
      maxUsers: plan.maxUsers,
      maxBranches: plan.maxBranches,
      stripeCustomerId: settings.stripeCustomerId || null,
      stripeSubscriptionId: settings.stripeSubscriptionId || null,
      currentPeriodEnd: settings.currentPeriodEnd || null,
      cancelAtPeriodEnd: settings.cancelAtPeriodEnd || false,
    };
  }

  // ── Create Stripe checkout session ────────────────────────────────────────
  async createCheckoutSession(tenantId: string, plan: string, returnUrl: string) {
    const stripeKey = this.config.get('STRIPE_SECRET_KEY', '');

    if (!stripeKey) {
      // Demo mode - return mock checkout URL
      return {
        url: `${returnUrl}?demo=true&plan=${plan}&tenantId=${tenantId}`,
        sessionId: `demo_sess_${Date.now()}`,
        message: 'Demo mode — configure STRIPE_SECRET_KEY for live payments',
      };
    }

    const planConfig = PLANS[(plan as keyof typeof PLANS)];
    if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

    // Real Stripe checkout
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[]': 'card',
        'line_items[0][price]': planConfig.stripePriceId,
        'line_items[0][quantity]': '1',
        'success_url': `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${returnUrl}?cancelled=true`,
        'metadata[tenantId]': tenantId,
        'metadata[plan]': plan,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Stripe error: ${err}`);
    }

    const session = await res.json();
    return { url: session.url, sessionId: session.id };
  }

  // ── Handle Stripe webhook ─────────────────────────────────────────────────
  async handleStripeWebhook(payload: string, signature: string) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', '');
    // In production: verify signature using Stripe SDK
    // stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    let event: any;
    try { event = JSON.parse(payload); } catch { throw new Error('Invalid payload'); }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { tenantId, plan } = session.metadata || {};
        if (tenantId && plan) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan,
              status: 'ACTIVE',
              settings: {
                ...(await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } }))?.settings as any || {},
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
              } as any,
            },
          });
          this.logger.log(`Tenant ${tenantId} upgraded to ${plan}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            settings: { path: ['stripeSubscriptionId'], equals: sub.id },
          },
        });
        if (tenant) {
          await this.prisma.tenant.update({
            where: { id: tenant.id },
            data: { plan: 'FREE', status: 'CANCELLED' },
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        this.logger.warn(`Payment failed for subscription: ${event.data.object.subscription}`);
        break;
      }
    }

    return { received: true };
  }

  // ── Cancel subscription ───────────────────────────────────────────────────
  async cancelSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const settings: any = tenant?.settings || {};
    const subId = settings.stripeSubscriptionId;

    if (!subId || subId.startsWith('demo')) {
      return { cancelled: true, message: 'Demo subscription cancelled' };
    }

    const stripeKey = this.config.get('STRIPE_SECRET_KEY', '');
    if (stripeKey) {
      await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'CANCELLED' },
    });

    return { cancelled: true };
  }

  // ── Get all plan options ───────────────────────────────────────────────────
  getPlans() {
    return Object.entries(PLANS).map(([name, config]) => ({
      name,
      price: config.price,
      priceFormatted: `₹${config.price / 100}/month`,
      maxUsers: config.maxUsers === -1 ? 'Unlimited' : config.maxUsers,
      maxBranches: config.maxBranches === -1 ? 'Unlimited' : config.maxBranches,
    }));
  }
}
