import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

interface NotificationPayload {
  tenantId: string;
  patientId?: string;
  phone: string;
  channel?: 'whatsapp' | 'sms' | 'email';
  // For text messages
  message?: string;
  // For template messages
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  // For media
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

  /**
   * Send appointment confirmation via WhatsApp
   */
  async sendAppointmentConfirmation(tenantId: string, appointment: any) {
    const message = [
      `\u2705 *Appointment Confirmed*`,
      ``,
      `\uD83D\uDC68\u200D\u2695\uFE0F Doctor: ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName || ''}`,
      `\uD83D\uDCCB Department: ${appointment.department?.name || 'General'}`,
      `\uD83D\uDCC5 Date: ${new Date(appointment.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
      `\uD83D\uDD50 Time: ${new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      `\uD83C\uDFAB Token: ${appointment.tokenNumber}`,
      ``,
      `Reply CANCEL to cancel or RESCHEDULE to change.`,
    ].join('\n');

    return this.whatsappService.sendTextMessage(tenantId, appointment.patient.phone, message);
  }

  /**
   * Send appointment reminder (24 hours before)
   */
  async sendAppointmentReminder(tenantId: string, appointment: any) {
    const message = [
      `\u23F0 *Appointment Reminder*`,
      ``,
      `You have an appointment tomorrow:`,
      `\uD83D\uDC68\u200D\u2695\uFE0F ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName || ''}`,
      `\uD83D\uDD50 ${new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      `\uD83C\uDFAB Token: ${appointment.tokenNumber}`,
      ``,
      `Reply CONFIRM to confirm or RESCHEDULE to change.`,
    ].join('\n');

    return this.whatsappService.sendTextMessage(tenantId, appointment.patient.phone, message);
  }

  /**
   * Send invoice via WhatsApp with payment link
   */
  async sendInvoice(tenantId: string, invoice: any, paymentLink?: string) {
    const items = (invoice.items as any[]).map(
      (item: any) => `  ${item.description}: \u20B9${(item.amount / 100).toFixed(0)}`
    ).join('\n');

    const message = [
      `\uD83D\uDCB3 *Invoice: ${invoice.invoiceNumber}*`,
      ``,
      items,
      ``,
      `Subtotal: \u20B9${(invoice.subtotal / 100).toFixed(0)}`,
      invoice.gstAmount > 0 ? `GST: \u20B9${(invoice.gstAmount / 100).toFixed(0)}` : '',
      invoice.discount > 0 ? `Discount: -\u20B9${(invoice.discount / 100).toFixed(0)}` : '',
      `*Total: \u20B9${(invoice.totalAmount / 100).toFixed(0)}*`,
      ``,
      paymentLink ? `Pay now: ${paymentLink}` : 'Please visit the billing counter for payment.',
    ].filter(Boolean).join('\n');

    return this.whatsappService.sendTextMessage(tenantId, invoice.patient.phone, message);
  }

  /**
   * Send lab report via WhatsApp
   */
  async sendLabReport(tenantId: string, phone: string, reportUrl: string, testName: string) {
    const message = `\uD83E\uDDEA Your ${testName} report is ready. Download below.`;
    return this.whatsappService.sendMediaMessage(tenantId, phone, reportUrl, 'document', message);
  }

  /**
   * Send prescription via WhatsApp
   */
  async sendPrescription(tenantId: string, phone: string, prescription: any) {
    const meds = (prescription.medications as any[]).map(
      (m: any) => `  \uD83D\uDC8A ${m.name} ${m.dosage} - ${m.frequency} x ${m.duration}`
    ).join('\n');

    const message = [
      `\uD83D\uDCDD *Prescription from Dr. ${prescription.doctor?.user?.firstName}*`,
      ``,
      meds,
      ``,
      prescription.notes ? `Note: ${prescription.notes}` : '',
      ``,
      `Please take medications as prescribed. Reply if you have questions.`,
    ].filter(Boolean).join('\n');

    return this.whatsappService.sendTextMessage(tenantId, phone, message);
  }

  /**
   * Send follow-up reminder (from automation engine)
   */
  async sendFollowUpReminder(tenantId: string, phone: string, patientName: string, reason: string, bookingLink?: string) {
    const message = [
      `Hi ${patientName},`,
      ``,
      `\uD83D\uDD14 It's time for your ${reason}.`,
      ``,
      `Would you like to book an appointment?`,
      ``,
      `Reply BOOK to schedule now.`,
    ].join('\n');

    return this.whatsappService.sendTextMessage(tenantId, phone, message);
  }

  /**
   * Send generic notification
   */
  async send(payload: NotificationPayload) {
    const channel = payload.channel || 'whatsapp';

    switch (channel) {
      case 'whatsapp':
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
        return this.whatsappService.sendTextMessage(payload.tenantId, payload.phone, payload.message || '');

      case 'sms': {
        // MSG91 SMS (India) — configure MSG91_AUTH_KEY in environment
        const msg91Key     = this.config.get('MSG91_AUTH_KEY', '');
        const msg91SenderId= this.config.get('MSG91_SENDER_ID', 'HSPBOT');
        const mobile       = payload.phone.replace(/\D/g, '').slice(-10);
        if (!msg91Key) {
          this.logger.log(`SMS (demo): to ${mobile}: ${payload.message}`);
          return { success: true, channel: 'sms', delivered: false, message: 'Configure MSG91_AUTH_KEY for live SMS' };
        }
        const smsRes = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authkey': msg91Key },
          body: JSON.stringify({
            template_id: this.config.get('MSG91_TEMPLATE_ID', ''),
            short_url: '0',
            recipients: [{ mobiles: `91${mobile}`, var1: payload.message || '' }],
          }),
        }).catch(() => null);
        const delivered = smsRes?.ok || false;
        this.logger.log(`SMS to ${mobile}: ${delivered ? 'sent' : 'failed'}`);
        return { success: delivered, channel: 'sms', delivered };
      }

      case 'email': {
        // SMTP email via Nodemailer — configure SMTP_* in environment
        const smtpHost = this.config.get('SMTP_HOST', '');
        const smtpUser = this.config.get('SMTP_USER', '');
        const smtpPass = this.config.get('SMTP_PASS', '');
        const smtpPort = Number(this.config.get('SMTP_PORT', '587'));
        const emailTo  = payload.email || '';

        if (!smtpHost || !smtpUser || !emailTo) {
          this.logger.log(`Email (demo): to ${emailTo}: ${payload.subject || 'HospiBot Notification'}`);
          return { success: true, channel: 'email', delivered: false, message: 'Configure SMTP_HOST, SMTP_USER, SMTP_PASS for live email' };
        }

        try {
          // Dynamic nodemailer import (optional dependency)
          // @ts-ignore
          const nodemailer = await import('nodemailer').catch(() => null);
          if (!nodemailer) {
            this.logger.warn('nodemailer not installed — run: npm install nodemailer');
            return { success: false, channel: 'email', message: 'nodemailer not installed' };
          }
          const transporter = nodemailer.createTransport({
            host: smtpHost, port: smtpPort, secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });
          await transporter.sendMail({
            from:    `"HospiBot" <${smtpUser}>`,
            to:      emailTo,
            subject: payload.subject || 'HospiBot Notification',
            text:    payload.message || '',
            html:    payload.html || `<p>${payload.message || ''}</p>`,
          });
          this.logger.log(`Email sent to ${emailTo}`);
          return { success: true, channel: 'email', delivered: true };
        } catch (err: any) {
          this.logger.error(`Email failed: ${err.message}`);
          return { success: false, channel: 'email', message: err.message };
        }
      }

      default:
        return { success: false, message: 'Unknown channel' };
    }
  }
}
