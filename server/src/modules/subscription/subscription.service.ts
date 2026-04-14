import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

const PLANS = {
  STARTER:      { price: 490000,  maxUsers: 5,  maxBranches: 1  },
  GROWTH:       { price: 990000,  maxUsers: 15, maxBranches: 2  },
  PROFESSIONAL: { price: 1990000, maxUsers: 50, maxBranches: 5  },
  ENTERPRISE:   { price: 4990000, maxUsers: -1, maxBranches: -1 },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private get auth() {
    const k = this.config.get('RAZORPAY_KEY_ID','');
    const s = this.config.get('RAZORPAY_KEY_SECRET','');
    return Buffer.from(`${k}:${s}`).toString('base64');
  }
  private get isLive() { return !!this.config.get('RAZORPAY_KEY_ID',''); }

  private async rzp(method: 'GET'|'POST', path: string, body?: any) {
    const r = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method,
      headers: { Authorization:`Basic ${this.auth}`, 'Content-Type':'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const d = await r.json();
    if (!r.ok) throw new BadRequestException(d?.error?.description || 'Razorpay error');
    return d;
  }

  getPlans() {
    return Object.entries(PLANS).map(([name,cfg]) => ({
      name,
      priceFormatted: `₹${(cfg.price/10000).toLocaleString('en-IN')}/month`,
      pricePaise: cfg.price,
      maxUsers: cfg.maxUsers===-1?'Unlimited':cfg.maxUsers,
      maxBranches: cfg.maxBranches===-1?'Unlimited':cfg.maxBranches,
    }));
  }

  async getSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where:{id:tenantId}, select:{id:true,name:true,plan:true,status:true,settings:true} });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const cfg = PLANS[(tenant.plan as keyof typeof PLANS)] || PLANS.STARTER;
    const s = (tenant.settings as any) || {};
    return { tenantId, plan:tenant.plan, status:tenant.status, pricePaise:cfg.price,
      priceFormatted:`₹${(cfg.price/10000).toLocaleString('en-IN')}/month`,
      razorpayCustomerId:s.razorpayCustomerId||null, razorpaySubscriptionId:s.razorpaySubscriptionId||null,
      razorpayStatus:s.razorpayStatus||null, currentPeriodEnd:s.currentPeriodEnd||null };
  }

  async createPaymentLink(tenantId: string, plan: string, returnUrl: string) {
    const cfg = PLANS[(plan as keyof typeof PLANS)];
    if (!cfg) throw new BadRequestException(`Invalid plan: ${plan}`);
    if (!this.isLive) return { url:`${returnUrl}?demo=true&plan=${plan}`, isDemoMode:true,
      message:'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for live payments' };
    const link = await this.rzp('POST', 'payment_links', {
      amount: cfg.price, currency:'INR',
      description: `HospiBot ${plan} Plan — Monthly Subscription`,
      reference_id: `HB-${plan}-${tenantId.slice(0,8).toUpperCase()}`,
      callback_url: returnUrl, callback_method:'get',
      reminder_enable: true, upi_link: true,
      notes: { tenantId, plan },
    });
    return { url:link.short_url, linkId:link.id };
  }

  async createSubscription(tenantId: string, plan: string, email: string) {
    const cfg = PLANS[(plan as keyof typeof PLANS)];
    if (!cfg) throw new BadRequestException(`Invalid plan: ${plan}`);
    if (!this.isLive) {
      const demoId = `sub_demo_${Date.now()}`;
      await this.prisma.tenant.update({ where:{id:tenantId}, data:{ plan: plan as any, status:'ACTIVE' as any,
        settings:{ ...((await this.prisma.tenant.findUnique({where:{id:tenantId},select:{settings:true}}))?.settings as any||{}),
          razorpaySubscriptionId:demoId, razorpayStatus:'active' } as any } });
      return { subscriptionId:demoId, isDemoMode:true,
        message:'Demo mode — configure Razorpay keys for live subscriptions' };
    }
    const tenant = await this.prisma.tenant.findUnique({where:{id:tenantId},select:{settings:true,name:true}});
    const s: any = (tenant?.settings||{}) as any;
    let customerId = s.razorpayCustomerId;
    if (!customerId) {
      const c = await this.rzp('POST','customers',{name:tenant?.name||'HospiBot Tenant',email,notes:{tenantId}});
      customerId = c.id;
    }
    // Create Razorpay Subscription (requires plan created in Razorpay dashboard)
    const sub = await this.rzp('POST','subscriptions',{
      plan_id: `plan_${plan.toLowerCase()}`, customer_notify:1, quantity:1, total_count:12,
      customer_id: customerId, notes:{tenantId,plan,email},
    });
    await this.prisma.tenant.update({ where:{id:tenantId}, data:{ plan: plan as any,
      settings:{...s, razorpayCustomerId:customerId, razorpaySubscriptionId:sub.id, razorpayStatus:sub.status} as any } });
    return { subscriptionId:sub.id, shortUrl:sub.short_url, status:sub.status };
  }

  async handleWebhook(payload: string, signature: string) {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET','');
    if (secret) {
      const expected = createHmac('sha256',secret).update(payload).digest('hex');
      if (expected !== signature) throw new BadRequestException('Invalid webhook signature');
    }
    let event: any;
    try { event = JSON.parse(payload); } catch { throw new BadRequestException('Invalid payload'); }
    this.logger.log(`Razorpay webhook: ${event.event}`);
    const entity = event.payload?.subscription?.entity || event.payload?.payment_link?.entity;
    const notes  = entity?.notes || {};
    const tenantId = notes.tenantId;
    const plan     = notes.plan;
    if (!tenantId) return { received:true };
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged':
        if (plan) await this.prisma.tenant.update({ where:{id:tenantId}, data:{ plan: plan as any, status:'ACTIVE' as any,
          settings:{ ...((await this.prisma.tenant.findUnique({where:{id:tenantId},select:{settings:true}}))?.settings as any||{}),
            razorpaySubscriptionId:entity?.id, razorpayStatus:'active',
            currentPeriodEnd:entity?.current_end ? new Date(entity.current_end*1000).toISOString() : null } as any } });
        break;
      case 'subscription.cancelled': case 'subscription.completed':
        await this.prisma.tenant.update({ where:{id:tenantId}, data:{plan:'FREE' as any,status:'CANCELLED' as any} }).catch(()=>{});
        break;
      case 'subscription.halted':
        await this.prisma.tenant.update({ where:{id:tenantId}, data:{status:'SUSPENDED'} }).catch(()=>{});
        break;
      case 'payment_link.paid':
        if (plan) await this.prisma.tenant.update({ where:{id:tenantId}, data:{plan,status:'ACTIVE'} }).catch(()=>{});
        break;
    }
    return { received:true, event:event.event };
  }

  async cancelSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({where:{id:tenantId},select:{settings:true}});
    const s: any = (tenant?.settings||{}) as any;
    const subId  = s.razorpaySubscriptionId;
    if (subId && !subId.startsWith('sub_demo') && this.isLive) {
      await this.rzp('POST',`subscriptions/${subId}/cancel`,{cancel_at_cycle_end:1});
    }
    await this.prisma.tenant.update({where:{id:tenantId},data:{status:'CANCELLED',
      settings:{...s,cancelAtPeriodEnd:true} as any}});
    return { cancelled:true };
  }
}
