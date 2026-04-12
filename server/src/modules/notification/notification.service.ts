import { Injectable, Logger } from '@nestjs/common';
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
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
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

      case 'sms':
        // TODO: Integrate SMS provider (MSG91, Twilio)
        this.logger.log(`SMS to ${payload.phone}: ${payload.message}`);
        return { success: true, channel: 'sms', message: 'SMS integration pending' };

      case 'email':
        // TODO: Integrate email provider (SendGrid, SES)
        this.logger.log(`Email notification for ${payload.phone}`);
        return { success: true, channel: 'email', message: 'Email integration pending' };

      default:
        return { success: false, message: 'Unknown channel' };
    }
  }
}
