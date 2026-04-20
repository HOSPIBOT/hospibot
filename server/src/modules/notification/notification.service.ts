import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

interface NotificationPayload {
  tenantId: string;
  patientId?: string;
  phone: string;
  channel?: 'whatsapp' | 'sms' | 'email';
  message?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  email?: string;
  subject?: string;
  html?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private config: ConfigService,
  ) {}

  // ── Convenience methods (unchanged) ──────────────────────────────────────

  async sendAppointmentConfirmation(tenantId: string, appointment: any) {
    const message = [
      `\u2705 *Appointment Confirmed*`, ``,
      `\uD83D\uDC68\u200D\u2695\uFE0F Doctor: ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName || ''}`,
      `\uD83D\uDCCB Department: ${appointment.department?.name || 'General'}`,
      `\uD83D\uDCC5 Date: ${new Date(appointment.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
      `\uD83D\uDD50 Time: ${new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      `\uD83C\uDFAB Token: ${appointment.tokenNumber}`, ``,
      `Reply CANCEL to cancel or RESCHEDULE to change.`,
    ].join('\n');
    return this.whatsappService.sendTextMessage(tenantId, appointment.patient.phone, message);
  }

  async sendAppointmentReminder(tenantId: string, appointment: any) {
    const message = [
      `\u23F0 *Appointment Reminder*`, ``,
      `You have an appointment tomorrow:`,
      `\uD83D\uDC68\u200D\u2695\uFE0F ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName || ''}`,
      `\uD83D\uDD50 ${new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      `\uD83C\uDFAB Token: ${appointment.tokenNumber}`, ``,
      `Reply CONFIRM to confirm or RESCHEDULE to change.`,
    ].join('\n');
    return this.whatsappService.sendTextMessage(tenantId, appointment.patient.phone, message);
  }

  async sendInvoice(tenantId: string, invoice: any, paymentLink?: string) {
    const items = (invoice.items as any[]).map(
      (item: any) => `  ${item.description}: \u20B9${(item.amount / 100).toFixed(0)}`
    ).join('\n');
    const message = [
      `\uD83D\uDCB0 *Invoice ${invoice.invoiceNumber}*`, ``,
      items, ``,
      `Total: \u20B9${(invoice.totalAmount / 100).toFixed(0)}`,
      paymentLink ? `\nPay online: ${paymentLink}` : '',
    ].join('\n');
    return this.whatsappService.sendTextMessage(tenantId, invoice.patient?.phone || '', message);
  }

  async sendLabReport(tenantId: string, phone: string, reportUrl: string, testName: string) {
    const message = `\uD83E\uDDEA Your *${testName}* report is ready!\n\nDownload: ${reportUrl}\n\nFor questions, reply to this message.`;
    return this.whatsappService.sendTextMessage(tenantId, phone, message);
  }

  async sendPrescription(tenantId: string, phone: string, prescription: any) {
    const meds = (prescription.medications || []).map((m: any) => `  \u2022 ${m.name} — ${m.dosage}`).join('\n');
    const message = [`\uD83D\uDCDD *Prescription*`, ``, `Dr. ${prescription.doctorName}`, meds, ``, `Follow up: ${prescription.followUpDate || 'As advised'}`].join('\n');
    return this.whatsappService.sendTextMessage(tenantId, phone, message);
  }

  async sendFollowUpReminder(tenantId: string, phone: string, patientName: string, reason: string, bookingLink?: string) {
    const message = [`\uD83D\uDD14 *Follow-up Reminder*`, ``, `Hi ${patientName},`, `Your follow-up for ${reason} is due.`, bookingLink ? `\nBook: ${bookingLink}` : '', `\nReply BOOK to schedule.`].join('\n');
    return this.whatsappService.sendTextMessage(tenantId, phone, message);
  }

  // ── Main send method — reads provider config from DB ──────────────────

  async send(payload: NotificationPayload) {
    const channel = payload.channel || 'whatsapp';

    switch (channel) {
      case 'whatsapp': {
        if (payload.templateName) {
          return this.whatsappService.sendTemplateMessage(
            payload.tenantId, payload.phone, payload.templateName,
            payload.templateLanguage, payload.templateComponents,
          );
        }
        if (payload.mediaUrl) {
          return this.whatsappService.sendMediaMessage(
            payload.tenantId, payload.phone, payload.mediaUrl,
            payload.mediaType || 'document', payload.caption,
          );
        }
        const waResult = await this.whatsappService.sendTextMessage(payload.tenantId, payload.phone, payload.message || '');
        await this.deductWalletCredit(payload.tenantId, 'whatsapp');
        return waResult;
      }

      case 'sms': {
        // READ SMS PROVIDER CONFIG FROM DATABASE (Super Admin controlled)
        const smsConfig = await this.getProviderConfig('sms');
        if (!smsConfig) {
          this.logger.log(`SMS not configured — message not sent to ${payload.phone}`);
          return { success: false, channel: 'sms', delivered: false, message: 'SMS provider not configured. Contact admin.' };
        }

        const creds = smsConfig.credentials as any;
        const settings = smsConfig.settings as any;
        const mobile = payload.phone.replace(/\D/g, '').slice(-10);

        let delivered = false;

        switch (smsConfig.provider) {
          case 'msg91': {
            if (!creds.authKey) return { success: false, channel: 'sms', message: 'MSG91 auth key not set' };
            const apiUrl = settings.apiUrl || 'https://api.msg91.com/api/v5/flow/';
            const smsRes = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'authkey': creds.authKey },
              body: JSON.stringify({
                template_id: settings.templateId || creds.templateId || '',
                short_url: '0',
                recipients: [{ mobiles: `${settings.countryCode || '91'}${mobile}`, var1: payload.message || '' }],
              }),
            }).catch(() => null);
            delivered = smsRes?.ok || false;
            break;
          }
          case 'twilio': {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;
            const smsRes = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString('base64')}`,
              },
              body: new URLSearchParams({ To: `+${settings.countryCode || '91'}${mobile}`, From: creds.fromNumber || '', Body: payload.message || '' }),
            }).catch(() => null);
            delivered = smsRes?.ok || false;
            break;
          }
          case 'gupshup': {
            const smsRes = await fetch('https://enterprise.smsgupshup.com/GatewayAPI/rest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                userid: creds.userId || '', password: creds.password || '',
                send_to: `${settings.countryCode || '91'}${mobile}`,
                msg: payload.message || '', msg_type: 'TEXT', method: 'sendMessage',
                v: '1.1', auth_scheme: 'PLAIN',
              }),
            }).catch(() => null);
            delivered = smsRes?.ok || false;
            break;
          }
          case 'textlocal': {
            const smsRes = await fetch('https://api.textlocal.in/send/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                apikey: creds.apiKey || '', numbers: mobile,
                message: payload.message || '', sender: creds.senderId || 'HSPBOT',
              }),
            }).catch(() => null);
            delivered = smsRes?.ok || false;
            break;
          }
          default:
            this.logger.warn(`Unknown SMS provider: ${smsConfig.provider}`);
            return { success: false, channel: 'sms', message: `Unsupported SMS provider: ${smsConfig.provider}` };
        }

        this.logger.log(`SMS [${smsConfig.provider}] to ${mobile}: ${delivered ? 'sent' : 'failed'}`);
        if (delivered) await this.deductWalletCredit(payload.tenantId, 'sms');
        return { success: delivered, channel: 'sms', delivered, provider: smsConfig.provider };
      }

      case 'email': {
        // READ EMAIL PROVIDER CONFIG FROM DATABASE (Super Admin controlled)
        const emailConfig = await this.getProviderConfig('email');
        if (!emailConfig) {
          this.logger.log(`Email not configured — email not sent to ${payload.email}`);
          return { success: false, channel: 'email', delivered: false, message: 'Email provider not configured. Contact admin.' };
        }

        const creds = emailConfig.credentials as any;
        const settings = emailConfig.settings as any;
        const emailTo = payload.email || '';
        if (!emailTo) return { success: false, channel: 'email', message: 'No recipient email' };

        try {
          switch (emailConfig.provider) {
            case 'smtp': {
              if (!creds.host || !creds.user) return { success: false, channel: 'email', message: 'SMTP host/user not configured' };
              // @ts-ignore
              const nodemailer = await import('nodemailer').catch(() => null);
              if (!nodemailer) return { success: false, channel: 'email', message: 'nodemailer not installed' };
              const transporter = nodemailer.createTransport({
                host: creds.host, port: Number(creds.port) || 587, secure: Number(creds.port) === 465,
                auth: { user: creds.user, pass: creds.pass },
              });
              await transporter.sendMail({
                from: `"${settings.fromName || 'HospiBot'}" <${settings.fromEmail || creds.user}>`,
                to: emailTo, subject: payload.subject || 'HospiBot Notification',
                text: payload.message || '', html: payload.html || `<p>${payload.message || ''}</p>`,
              });
              break;
            }
            case 'sendgrid': {
              await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${creds.apiKey}` },
                body: JSON.stringify({
                  personalizations: [{ to: [{ email: emailTo }] }],
                  from: { email: settings.fromEmail || creds.fromEmail, name: settings.fromName || 'HospiBot' },
                  subject: payload.subject || 'HospiBot Notification',
                  content: [{ type: 'text/html', value: payload.html || `<p>${payload.message || ''}</p>` }],
                }),
              });
              break;
            }
            case 'resend': {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${creds.apiKey}` },
                body: JSON.stringify({
                  from: `${settings.fromName || 'HospiBot'} <${settings.fromEmail || 'noreply@hospibot.in'}>`,
                  to: emailTo, subject: payload.subject || 'HospiBot Notification',
                  html: payload.html || `<p>${payload.message || ''}</p>`,
                }),
              });
              break;
            }
            default:
              return { success: false, channel: 'email', message: `Unsupported email provider: ${emailConfig.provider}` };
          }
          this.logger.log(`Email [${emailConfig.provider}] sent to ${emailTo}`);
          return { success: true, channel: 'email', delivered: true, provider: emailConfig.provider };
        } catch (err: any) {
          this.logger.error(`Email failed: ${err.message}`);
          return { success: false, channel: 'email', message: err.message };
        }
      }

      default:
        return { success: false, message: 'Unknown channel' };
    }
  }

  // ── Read provider config from DB (cached for performance) ──────────────

  private configCache: Map<string, { data: any; expiry: number }> = new Map();

  private async getProviderConfig(channel: string): Promise<any> {
    const cached = this.configCache.get(channel);
    if (cached && cached.expiry > Date.now()) return cached.data;

    try {
      const config = await this.prisma.communicationConfig.findUnique({ where: { channel } });
      if (config && config.isActive) {
        this.configCache.set(channel, { data: config, expiry: Date.now() + 60000 }); // cache 60s
        return config;
      }
    } catch {
      this.logger.warn(`Failed to read CommunicationConfig for ${channel} — falling back to env vars`);
    }

    // FALLBACK: read from env vars (backward compatible)
    if (channel === 'sms') {
      const authKey = this.config.get('MSG91_AUTH_KEY', '');
      if (authKey) return { provider: 'msg91', credentials: { authKey, senderId: this.config.get('MSG91_SENDER_ID', 'HSPBOT') },
        settings: { templateId: this.config.get('MSG91_TEMPLATE_ID', ''), apiUrl: 'https://api.msg91.com/api/v5/flow/', countryCode: '91' }, isActive: true };
    }
    if (channel === 'email') {
      const host = this.config.get('SMTP_HOST', '');
      if (host) return { provider: 'smtp', credentials: { host, port: this.config.get('SMTP_PORT', '587'), user: this.config.get('SMTP_USER', ''), pass: this.config.get('SMTP_PASS', '') },
        settings: { fromName: 'HospiBot', fromEmail: this.config.get('SMTP_USER', '') }, isActive: true };
    }
    return null;
  }

  // ── Wallet deduction (per-message billing) ─────────────────────────────

  private async deductWalletCredit(tenantId: string, type: 'whatsapp' | 'sms', count: number = 1) {
    try {
      const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
      if (!wallet) return;

      // Read sell price from CommunicationConfig
      let costPerUnit = type === 'whatsapp' ? 50 : 25; // default paise
      try {
        const config = await this.getProviderConfig(type === 'whatsapp' ? 'whatsapp' : 'sms');
        if (config?.sellPricePerUnit) costPerUnit = config.sellPricePerUnit;
      } catch {}

      if (type === 'whatsapp') {
        const costCredits = (costPerUnit / 100) * count; // convert paise to credits (₹)
        await this.prisma.tenantWallet.update({
          where: { tenantId }, data: { waCredits: { decrement: costCredits } },
        });
        await this.prisma.walletTransaction.create({
          data: { tenantId, walletId: wallet.id, walletType: 'WHATSAPP', txType: 'DEBIT_USAGE',
            amount: costCredits, balanceBefore: wallet.waCredits, balanceAfter: wallet.waCredits - costCredits,
            description: `WhatsApp message x${count}`, referenceId: `wa-auto-${Date.now()}` },
        });
      } else {
        await this.prisma.tenantWallet.update({
          where: { tenantId }, data: { smsCredits: { decrement: count } },
        });
        await this.prisma.walletTransaction.create({
          data: { tenantId, walletId: wallet.id, walletType: 'SMS', txType: 'DEBIT_USAGE',
            amount: count, balanceBefore: wallet.smsCredits, balanceAfter: wallet.smsCredits - count,
            description: `SMS message x${count}`, referenceId: `sms-auto-${Date.now()}` },
        });
      }
    } catch (err) {
      this.logger.warn(`Wallet deduction failed for ${tenantId}: ${err}`);
    }
  }
}
