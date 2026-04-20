import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Communications Configuration Service
 * 
 * Super Admin controls ALL communication providers:
 * - SMS: MSG91, Twilio, Gupshup, Kaleyra, Textlocal, Vodafone DLT
 * - Email: SMTP (Gmail/Outlook/Custom), SendGrid, AWS SES, Resend, Mailgun
 * - WhatsApp: Meta Cloud API, Gupshup WABA, Twilio WhatsApp, 360dialog
 * 
 * Tenants NEVER see provider details — they only use credits.
 * Pricing per unit (SMS/email/WA message) is set by super admin.
 */

// Default provider configs (used on first boot)
const DEFAULT_CONFIGS = [
  {
    channel: 'sms', provider: 'msg91', displayName: 'MSG91 (India)',
    credentials: { authKey: '', senderId: 'HSPBOT', dltEntityId: '' },
    settings: { templateId: '', apiUrl: 'https://api.msg91.com/api/v5/flow/', countryCode: '91' },
    costPerUnit: 12, sellPricePerUnit: 25, unitLabel: 'SMS',
    rateCardJson: [
      { min: 0, max: 1000, pricePerUnit: 25, label: 'Standard' },
      { min: 1001, max: 5000, pricePerUnit: 20, label: 'Bulk' },
      { min: 5001, max: 999999, pricePerUnit: 15, label: 'Enterprise' },
    ],
  },
  {
    channel: 'email', provider: 'smtp', displayName: 'SMTP (Generic)',
    credentials: { host: '', port: 587, user: '', pass: '', secure: false },
    settings: { fromName: 'HospiBot', fromEmail: '', replyTo: '' },
    costPerUnit: 1, sellPricePerUnit: 5, unitLabel: 'email',
    rateCardJson: null,
  },
  {
    channel: 'whatsapp', provider: 'meta_cloud_api', displayName: 'Meta Cloud API',
    credentials: { accessToken: '', phoneNumberId: '', businessAccountId: '', verifyToken: '' },
    settings: { apiVersion: 'v19.0', webhookUrl: '', defaultLanguage: 'en' },
    costPerUnit: 40, sellPricePerUnit: 50, unitLabel: 'message',
    rateCardJson: [
      { category: 'utility', pricePerUnit: 35, label: 'Utility (OTP, alerts)' },
      { category: 'marketing', pricePerUnit: 80, label: 'Marketing (promos)' },
      { category: 'service', pricePerUnit: 0, label: 'Service (24h window)' },
    ],
  },
];

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  constructor(private prisma: PrismaService) {}

  /** Get all communication configs */
  async getAllConfigs() {
    const configs = await this.prisma.communicationConfig.findMany({ orderBy: { channel: 'asc' } });
    // Mask sensitive credentials for display
    return configs.map(c => ({
      ...c,
      credentials: this.maskCredentials(c.credentials as any),
      hasCredentials: this.hasValidCredentials(c.credentials as any),
    }));
  }

  /** Get config for a specific channel */
  async getConfig(channel: string) {
    const config = await this.prisma.communicationConfig.findUnique({ where: { channel } });
    if (!config) throw new NotFoundException(`No config found for channel: ${channel}`);
    return {
      ...config,
      credentials: this.maskCredentials(config.credentials as any),
      hasCredentials: this.hasValidCredentials(config.credentials as any),
    };
  }

  /** Get RAW config (unmasked) — used internally by notification service */
  async getRawConfig(channel: string): Promise<any> {
    const config = await this.prisma.communicationConfig.findUnique({ where: { channel } });
    if (!config || !config.isActive) return null;
    return config;
  }

  /** Update provider config (change provider, credentials, pricing) */
  async updateConfig(channel: string, dto: any, adminId: string) {
    const existing = await this.prisma.communicationConfig.findUnique({ where: { channel } });
    
    const data: any = { updatedBy: adminId };
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.credentials !== undefined) {
      // Merge credentials — don't overwrite fields not provided
      const existing_creds = (existing?.credentials as any) || {};
      data.credentials = { ...existing_creds, ...dto.credentials };
    }
    if (dto.settings !== undefined) {
      const existing_settings = (existing?.settings as any) || {};
      data.settings = { ...existing_settings, ...dto.settings };
    }
    if (dto.costPerUnit !== undefined) data.costPerUnit = Number(dto.costPerUnit);
    if (dto.sellPricePerUnit !== undefined) data.sellPricePerUnit = Number(dto.sellPricePerUnit);
    if (dto.unitLabel !== undefined) data.unitLabel = dto.unitLabel;
    if (dto.rateCardJson !== undefined) data.rateCardJson = dto.rateCardJson;
    if (dto.fallbackProvider !== undefined) data.fallbackProvider = dto.fallbackProvider;
    if (dto.maxRetries !== undefined) data.maxRetries = Number(dto.maxRetries);
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (existing) {
      return this.prisma.communicationConfig.update({ where: { channel }, data });
    } else {
      return this.prisma.communicationConfig.create({ data: { channel, ...data } });
    }
  }

  /** Seed default configs (run on first boot) */
  async seedDefaults() {
    let seeded = 0;
    for (const cfg of DEFAULT_CONFIGS) {
      const exists = await this.prisma.communicationConfig.findUnique({ where: { channel: cfg.channel } });
      if (!exists) {
        await this.prisma.communicationConfig.create({ data: cfg as any });
        seeded++;
      }
    }
    return { seeded, total: DEFAULT_CONFIGS.length };
  }

  /** Test provider connection (send a test message) */
  async testProvider(channel: string) {
    const config = await this.getRawConfig(channel);
    if (!config) return { success: false, message: `${channel} provider not configured or inactive` };
    
    const creds = config.credentials as any;
    switch (channel) {
      case 'sms': {
        const hasKey = creds.authKey && creds.authKey.length > 5;
        return { success: hasKey, message: hasKey ? 'SMS provider credentials present — ready to send' : 'Missing authKey in credentials', provider: config.provider };
      }
      case 'email': {
        const hasHost = creds.host && creds.user;
        return { success: !!hasHost, message: hasHost ? 'SMTP credentials present — ready to send' : 'Missing host or user in credentials', provider: config.provider };
      }
      case 'whatsapp': {
        const hasToken = creds.accessToken && creds.phoneNumberId;
        return { success: !!hasToken, message: hasToken ? 'WhatsApp API credentials present — ready to send' : 'Missing accessToken or phoneNumberId', provider: config.provider };
      }
      default:
        return { success: false, message: `Unknown channel: ${channel}` };
    }
  }

  /** Get available providers list per channel */
  getAvailableProviders() {
    return {
      sms: [
        { slug: 'msg91', name: 'MSG91', country: 'India', features: ['DLT support', 'Flow API', 'OTP', 'Promotional'] },
        { slug: 'twilio', name: 'Twilio', country: 'Global', features: ['International', 'Programmable SMS', 'Verify API'] },
        { slug: 'gupshup', name: 'Gupshup', country: 'India/Global', features: ['DLT', 'WhatsApp+SMS combo', 'OTP'] },
        { slug: 'kaleyra', name: 'Kaleyra', country: 'India/Global', features: ['Enterprise', 'DLT', 'Voice+SMS'] },
        { slug: 'textlocal', name: 'Textlocal', country: 'India', features: ['Budget-friendly', 'DLT', 'Bulk SMS'] },
        { slug: 'valuefirst', name: 'ValueFirst (Vodafone)', country: 'India', features: ['Carrier-grade', 'DLT', 'Enterprise'] },
      ],
      email: [
        { slug: 'smtp', name: 'SMTP (Generic)', country: 'Any', features: ['Gmail', 'Outlook', 'Custom SMTP'] },
        { slug: 'sendgrid', name: 'SendGrid', country: 'Global', features: ['Transactional', 'Marketing', 'Templates'] },
        { slug: 'ses', name: 'AWS SES', country: 'Global', features: ['Cheapest at scale', 'Bounce handling'] },
        { slug: 'resend', name: 'Resend', country: 'Global', features: ['Developer-friendly', 'React email', 'Free tier'] },
        { slug: 'mailgun', name: 'Mailgun', country: 'Global', features: ['Transactional', 'Logs', 'Validation'] },
      ],
      whatsapp: [
        { slug: 'meta_cloud_api', name: 'Meta Cloud API (Direct)', country: 'Global', features: ['Official', 'Free service msgs', 'Templates'] },
        { slug: 'gupshup_wa', name: 'Gupshup WhatsApp', country: 'India/Global', features: ['BSP', 'Easy onboarding', 'Chatbot'] },
        { slug: 'twilio_wa', name: 'Twilio WhatsApp', country: 'Global', features: ['Programmable', 'Multi-channel'] },
        { slug: '360dialog', name: '360dialog', country: 'Global', features: ['BSP', 'Direct API', 'Multi-number'] },
        { slug: 'wati', name: 'WATI', country: 'India/Global', features: ['No-code chatbot', 'Team inbox', 'BSP'] },
      ],
    };
  }

  /** Get pricing summary for super admin dashboard */
  async getPricingSummary() {
    const configs = await this.prisma.communicationConfig.findMany();
    return configs.map(c => ({
      channel: c.channel,
      provider: (c as any).displayName || c.provider,
      costPerUnit: c.costPerUnit,
      sellPricePerUnit: c.sellPricePerUnit,
      marginPerUnit: c.sellPricePerUnit - c.costPerUnit,
      marginPercent: c.costPerUnit > 0 ? Math.round(((c.sellPricePerUnit - c.costPerUnit) / c.costPerUnit) * 100) : 0,
      unitLabel: c.unitLabel,
      rateCard: c.rateCardJson,
    }));
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private maskCredentials(creds: Record<string, any>): Record<string, any> {
    if (!creds) return {};
    const masked: any = {};
    for (const [key, val] of Object.entries(creds)) {
      if (typeof val === 'string' && val.length > 4 && 
          (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || 
           key.toLowerCase().includes('token') || key.toLowerCase().includes('pass'))) {
        masked[key] = val.substring(0, 4) + '****' + val.substring(val.length - 4);
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }

  private hasValidCredentials(creds: Record<string, any>): boolean {
    if (!creds) return false;
    return Object.values(creds).some(v => typeof v === 'string' && v.length > 3);
  }
}
