import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(forwardRef(() => ChatbotService)) private chatbotService: ChatbotService,
  ) {
    this.apiUrl = config.get('WHATSAPP_API_URL', 'https://graph.facebook.com/v19.0');
  }

  // ==========================================
  // SENDING MESSAGES
  // ==========================================

  /**
   * Send a text message via WhatsApp Cloud API
   */
  async sendTextMessage(tenantId: string, to: string, message: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.waPhoneNumberId || !tenant?.waAccessToken) {
      this.logger.warn(`Tenant ${tenantId} has no WhatsApp configuration. Message queued locally.`);
      // Store message locally even if WA is not configured (for demo/testing)
      return this.storeOutboundMessage(tenantId, to, message, null);
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${tenant.waPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/[^0-9]/g, ''), // Strip non-numeric
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${tenant.waAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const waMessageId = response.data?.messages?.[0]?.id;
      await this.storeOutboundMessage(tenantId, to, message, waMessageId);

      return { success: true, messageId: waMessageId };
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      await this.storeOutboundMessage(tenantId, to, message, null, 'FAILED');
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send a template message (for notifications, reminders)
   */
  async sendTemplateMessage(
    tenantId: string,
    to: string,
    templateName: string,
    language: string = 'en',
    components: any[] = [],
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.waPhoneNumberId || !tenant?.waAccessToken) {
      this.logger.warn(`Tenant ${tenantId}: WhatsApp not configured. Template message logged.`);
      return this.storeOutboundMessage(tenantId, to, `[Template: ${templateName}]`, null);
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${tenant.waPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/[^0-9]/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tenant.waAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const waMessageId = response.data?.messages?.[0]?.id;
      await this.storeOutboundMessage(tenantId, to, `[Template: ${templateName}]`, waMessageId);
      return { success: true, messageId: waMessageId };
    } catch (error: any) {
      this.logger.error(`Failed to send template: ${error.message}`);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send a document/media message (reports, prescriptions)
   */
  async sendMediaMessage(tenantId: string, to: string, mediaUrl: string, mediaType: string, caption?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.waPhoneNumberId || !tenant?.waAccessToken) {
      return this.storeOutboundMessage(tenantId, to, `[Media: ${mediaType}] ${caption || ''}`, null);
    }

    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: mediaType,
      };

      payload[mediaType] = { link: mediaUrl };
      if (caption) payload[mediaType].caption = caption;

      const response = await axios.post(
        `${this.apiUrl}/${tenant.waPhoneNumberId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${tenant.waAccessToken}`, 'Content-Type': 'application/json' } },
      );

      const waMessageId = response.data?.messages?.[0]?.id;
      await this.storeOutboundMessage(tenantId, to, caption || `[${mediaType}]`, waMessageId, 'SENT', mediaUrl, mediaType);
      return { success: true, messageId: waMessageId };
    } catch (error: any) {
      this.logger.error(`Failed to send media: ${error.message}`);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // ==========================================
  // WEBHOOK PROCESSING
  // ==========================================

  /**
   * Process incoming webhook from Meta Cloud API
   */
  async processWebhook(body: any) {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const metadata = value.metadata;
        const phoneNumberId = metadata?.phone_number_id;

        // Find tenant by WhatsApp phone number ID
        const tenant = await this.prisma.tenant.findFirst({
          where: { waPhoneNumberId: phoneNumberId },
        });

        if (!tenant) {
          this.logger.warn(`No tenant found for phone_number_id: ${phoneNumberId}`);
          continue;
        }

        // Process messages
        const messages = value.messages || [];
        for (const msg of messages) {
          await this.handleIncomingMessage(tenant.id, msg, value.contacts);
        }

        // Process status updates
        const statuses = value.statuses || [];
        for (const status of statuses) {
          await this.handleStatusUpdate(status);
        }
      }
    }
  }

  /**
   * Handle a single incoming message
   */
  private async handleIncomingMessage(tenantId: string, msg: any, contacts: any[]) {
    const from = msg.from; // Phone number
    const contactName = contacts?.[0]?.profile?.name || null;
    const messageType = msg.type;
    let content = '';
    let mediaUrl = null;

    switch (messageType) {
      case 'text':
        content = msg.text?.body || '';
        break;
      case 'image':
        content = msg.image?.caption || '[Image]';
        mediaUrl = msg.image?.id; // Media ID, needs to be fetched
        break;
      case 'document':
        content = msg.document?.caption || `[Document: ${msg.document?.filename || 'file'}]`;
        mediaUrl = msg.document?.id;
        break;
      case 'audio':
        content = '[Audio message]';
        mediaUrl = msg.audio?.id;
        break;
      case 'interactive':
        // Button reply or list reply
        if (msg.interactive?.type === 'button_reply') {
          content = msg.interactive.button_reply.title;
        } else if (msg.interactive?.type === 'list_reply') {
          content = msg.interactive.list_reply.title;
        }
        break;
      default:
        content = `[${messageType}]`;
    }

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, waContactPhone: from },
    });

    let patient: any = null;
    if (!conversation) {
      // Try to find existing patient by phone
      patient = await this.prisma.patient.findFirst({
        where: { tenantId, phone: { contains: from.slice(-10) }, deletedAt: null },
      });

      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          patientId: patient?.id || null,
          waContactPhone: from,
          waContactName: contactName,
          isBot: true, // Bot handles initially
          lastMessageAt: new Date(),
          messageCount: 0,
          unreadCount: 0,
        },
      });

      // If no patient found, create a lead
      if (!patient) {
        await this.prisma.lead.create({
          data: {
            tenantId,
            name: contactName,
            phone: from,
            source: 'WHATSAPP',
            stage: 'NEW',
          },
        });
      }
    }

    // Store the message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content,
        mediaUrl,
        mediaType: messageType !== 'text' ? messageType : null,
        waMessageId: msg.id,
        status: 'DELIVERED',
        senderType: 'patient',
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
        unreadCount: { increment: 1 },
        waContactName: contactName || conversation.waContactName,
      },
    });

    this.logger.log(`Incoming message from ${from} to tenant ${tenantId}: ${content.substring(0, 50)}`);

    // Handle critical value ACK: patient or doctor replies "ACK <alertId>"
    const ackMatch = content.trim().match(/^ACK\s+([a-f0-9]{8})/i);
    if (ackMatch) {
      const partialId = ackMatch[1].toLowerCase();
      try {
        const alert = await this.prisma.criticalValueAlert.findFirst({
          where: { id: { startsWith: partialId }, acknowledgedAt: null },
        });
        if (alert) {
          await this.prisma.criticalValueAlert.update({
            where: { id: alert.id },
            data: { acknowledgedBy: from, acknowledgedAt: new Date() },
          });
          await this.sendTextMessage(tenantId, from, `✅ Critical value alert acknowledged. Thank you for confirming receipt. The clinical team has been notified.`);
          this.logger.log(`Critical value alert ${alert.id} acknowledged by ${from}`);
        }
      } catch {}
    }

    // Handle Revenue Engine responses: BOOK/STOP/REMIND_LATER
    const normalized = content.trim().toUpperCase();
    if (['BOOK', 'BOOK NOW', '1'].includes(normalized)) {
      // Mark latest automation execution for this patient as converted
      const exec = await this.prisma.diagnosticAutomationExecution.findFirst({
        where: { patientMobile: { contains: from.slice(-10) }, status: 'SENT' },
        orderBy: { sentAt: 'desc' },
      });
      if (exec) {
        await this.prisma.diagnosticAutomationExecution.update({
          where: { id: exec.id }, data: { status: 'CONVERTED', response: 'BOOK_NOW' },
        });
        await this.sendTextMessage(tenantId, from, `🎉 Great! Please call us or visit the lab to book your test. Our team will be happy to assist you.`);
      }
    } else if (['STOP', 'OPT OUT', 'UNSUBSCRIBE'].includes(normalized)) {
      await this.prisma.diagnosticAutomationExecution.updateMany({
        where: { patientMobile: { contains: from.slice(-10) }, status: 'SENT' },
        data: { status: 'OPTED_OUT', response: 'STOP' },
      });
      await this.sendTextMessage(tenantId, from, `✅ You've been unsubscribed from test reminders. You can always call us directly to book.`);
    }

    // Route to chatbot if bot mode is ON for this conversation
    if (conversation.isBot && content && messageType === 'text' || messageType === 'interactive') {
      setImmediate(() => {
        this.chatbotService.handleMessage(
          tenantId,
          conversation.id,
          from,
          content,
          patient?.id,
        ).catch(err => this.logger.error(`Chatbot error: ${err.message}`));
      });
    }

    return { conversationId: conversation.id, content };
  }

  /**
   * Handle message status updates (sent, delivered, read)
   */
  private async handleStatusUpdate(status: any) {
    const waMessageId = status.id;
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    const newStatus = statusMap[status.status];
    if (!newStatus || !waMessageId) return;

    await this.prisma.message.updateMany({
      where: { waMessageId },
      data: { status: newStatus as any },
    });
  }

  // ==========================================
  // CONVERSATION MANAGEMENT
  // ==========================================

  /**
   * Get conversations (inbox) for a tenant
   */
  async getConversations(tenantId: string, filters: { unreadOnly?: boolean; assignedTo?: string; limit?: number }) {
    const where: any = { tenantId, isClosed: false };
    if (filters.unreadOnly) where.unreadCount = { gt: 0 };
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    return this.prisma.conversation.findMany({
      where,
      take: filters.limit || 50,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, healthId: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, direction: true, createdAt: true },
        },
      },
    });
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(tenantId: string, conversationId: string, limit: number = 50, before?: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) return [];

    const where: any = { conversationId };
    if (before) where.createdAt = { lt: new Date(before) };

    // Mark as read
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return this.prisma.message.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Assign conversation to a staff member
   */
  async assignConversation(tenantId: string, conversationId: string, assignTo: string, department?: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedTo: assignTo,
        department,
        isBot: false, // Human taking over
      },
    });
  }

  /**
   * Switch conversation back to bot
   */
  async switchToBot(tenantId: string, conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBot: true, assignedTo: null },
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private async storeOutboundMessage(
    tenantId: string, to: string, content: string, waMessageId: string | null,
    status: string = 'SENT', mediaUrl?: string, mediaType?: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, waContactPhone: to },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { tenantId, waContactPhone: to, lastMessageAt: new Date() },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        content,
        mediaUrl,
        mediaType,
        waMessageId,
        status: status as any,
        senderType: 'bot',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), messageCount: { increment: 1 } },
    });

    return { messageId: message.id, waMessageId, conversationId: conversation.id };

}

  // ── Diagnostic-Specific WhatsApp Templates ────────────────────────────────

  getTemplateForEvent(event: string, data: any): { body: string; buttons?: string[] } | null {
    const templates: Record<string, (d: any) => { body: string; buttons?: string[] }> = {
      // ── Report Ready ──
      report_ready: (d) => ({
        body: `Hi ${d.patientName},\n\nYour *${d.testName}* report from *${d.labName}* is ready.\n\nReport ID: ${d.reportId}\nDate: ${d.date}\n\nYou can download your report using the link below. For any questions, please contact us.`,
        buttons: ['Download Report', 'Book Follow-up'],
      }),
      // ── Critical Value Alert ──
      critical_alert: (d) => ({
        body: `URGENT - Critical Value Alert\n\nDr. ${d.doctorName},\n\nPatient: ${d.patientName}\nTest: ${d.testName}\nResult: ${d.value} ${d.unit} (Ref: ${d.refRange})\n\nPlease review immediately. This value requires clinical attention.`,
        buttons: ['Acknowledge', 'Call Lab'],
      }),
      // ── Appointment Reminder ──
      appointment_reminder: (d) => ({
        body: `Reminder: ${d.patientName}, you have a *${d.testName}* appointment at *${d.labName}*.\n\nDate: ${d.date}\nTime: ${d.time}\nAddress: ${d.address}\n\nPlease bring a valid ID and arrive 15 minutes early.`,
        buttons: ['Confirm', 'Reschedule'],
      }),
      // ── Sample Collected ──
      sample_collected: (d) => ({
        body: `Hi ${d.patientName},\n\nYour sample has been collected successfully.\n\nSample ID: ${d.sampleId}\nTests: ${d.tests}\nExpected Report: ${d.eta}\n\nWe'll notify you when your report is ready.`,
      }),
      // ── Home Collection Slot ──
      home_collection_booking: (d) => ({
        body: `Hi ${d.patientName},\n\nYour home sample collection is confirmed.\n\nDate: ${d.date}\nSlot: ${d.slot}\nAgent: ${d.agentName}\nTests: ${d.tests}\n\nOur phlebotomist will call you 30 min before arrival.`,
        buttons: ['Track Agent', 'Reschedule'],
      }),
      // ── Invoice / Bill ──
      invoice_generated: (d) => ({
        body: `Hi ${d.patientName},\n\nInvoice from *${d.labName}*:\n\nInvoice #: ${d.invoiceNo}\nAmount: ₹${d.amount}\nGST: ₹${d.gst}\nTotal: ₹${d.total}\n\nPay securely using the link below.`,
        buttons: ['Pay Now', 'Download Invoice'],
      }),
      // ── TPA Approval ──
      tpa_approved: (d) => ({
        body: `Good news ${d.patientName}!\n\nYour insurance pre-authorization has been *approved*.\n\nInsurer: ${d.insurerName}\nApproval #: ${d.approvalNo}\nApproved Amount: ₹${d.approvedAmount}\n\nYou can proceed with your tests.`,
      }),
      // ── Package Booking ──
      package_booked: (d) => ({
        body: `Hi ${d.patientName},\n\nYour *${d.packageName}* health checkup is booked.\n\nDate: ${d.date}\nTime: ${d.time}\nTests: ${d.testCount} tests included\nFasting: ${d.fasting ? 'Required (10-12 hrs)' : 'Not required'}\n\nPlease arrive 15 minutes early.`,
        buttons: ['View Package', 'Reschedule'],
      }),
      // ── PC-PNDT Form F (USG) ──
      pndt_form_f: (d) => ({
        body: `Dear ${d.doctorName},\n\nPC-PNDT Form F has been generated for patient ${d.patientName}.\n\nForm ID: ${d.formId}\nScan Type: ${d.scanType}\nDate: ${d.date}\n\nPlease verify and sign before report release.`,
      }),
      // ── QC Failure Alert ──
      qc_failure: (d) => ({
        body: `QC ALERT - ${d.labName}\n\nWestgard rule violation detected:\n\nAnalyzer: ${d.analyzerName}\nTest: ${d.testName}\nRule: ${d.rule}\nValue: ${d.value}\n\nPlease investigate before processing patient samples.`,
      }),
      // ── Referral Doctor Update ──
      referral_update: (d) => ({
        body: `Dr. ${d.doctorName},\n\nUpdate on your referred patient:\n\nPatient: ${d.patientName}\nTest: ${d.testName}\nStatus: ${d.status}\n\n${d.status === 'Ready' ? 'Report is ready for your review.' : `Expected by: ${d.eta}`}`,
        buttons: ['View Report'],
      }),
      // ── Subscription Renewal ──
      subscription_renewal: (d) => ({
        body: `Hi ${d.adminName},\n\nYour *${d.planName}* subscription for *${d.labName}* is due for renewal.\n\nRenewal Date: ${d.renewalDate}\nAmount: ₹${d.amount}/month + GST\n\nRenew now to avoid service interruption.`,
        buttons: ['Renew Now'],
      }),
      // ── Low Wallet Balance ──
      low_balance: (d) => ({
        body: `Alert: ${d.labName}\n\nYour ${d.walletType} balance is running low.\n\nCurrent Balance: ${d.balance} credits\nEstimated Days Left: ${d.daysLeft}\n\nRecharge now to avoid service disruption.`,
        buttons: ['Recharge Now'],
      }),
    };

    const tmpl = templates[event];
    return tmpl ? tmpl(data) : null;
  }
