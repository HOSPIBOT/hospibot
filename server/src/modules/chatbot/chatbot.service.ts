import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

// ── Intent patterns ───────────────────────────────────────────────────────────
const INTENT_PATTERNS = {
  BOOKING: [
    /appointment|book|doctor|consult|opd|checkup|visit|schedule|slot/i,
    /appoint|doctor se milna|doctor chahiye|appointment chahiye|booking/i,
    /meet.*doctor|see.*doctor|doctor.*appointment/i,
  ],
  REPORT: [
    /report|result|test|lab|blood|scan|x.?ray|mri|ct|urine|stool/i,
    /report.*ready|test.*result|download.*report|my.*report/i,
    /report chahiye|result chahiye|lab result/i,
  ],
  BILLING: [
    /bill|invoice|payment|pay|due|amount|fee|receipt|cost|charge/i,
    /bill.*pay|payment.*due|pay.*bill|invoice.*ready/i,
    /paisa|rupee|amount due/i,
  ],
  PRESCRIPTION: [
    /prescription|medicine|tablet|capsule|syrup|drug|medication|refill/i,
    /dawa|dawai|medicine chahiye|prescription chahiye/i,
  ],
  EMERGENCY: [
    /emergency|urgent|critical|severe|chest.*pain|breathe|unconscious|accident/i,
    /help.*now|immediately|serious|ambulance|icu|crash/i,
    /bahut dard|chest mein dard|sans nahi|emergency/i,
  ],
  HUMAN: [
    /human|staff|reception|person|talk.*to.*someone|connect.*staff|agent/i,
    /manav|koi insaan|staff se baat|operator/i,
  ],
  RECORDS: [
    /my.*record|health.*record|history|previous.*visit|past.*visit|my.*health/i,
    /mera record|health history|medical history/i,
  ],
  GREETING: [
    /^(hi|hello|hey|namaste|halo|good\s*(morning|afternoon|evening)|start|begin)[\s!.]*$/i,
  ],
  CONFIRM: [/^(yes|confirm|ok|okay|sure|haan|ha|theek|proceed|book)[\s!.]*$/i],
  CANCEL:  [/^(no|cancel|nope|nahi|naa|stop|quit|exit)[\s!.]*$/i],
  BOOK_NOW: [/book now|book appointment|schedule|book karo|book kar|yes book/i],
  REMIND_LATER: [/remind later|later|baad mein|remind.*later|not now/i],
  NOT_NEEDED: [/not needed|dont need|no thanks|nahi chahiye|theek hoon|i am fine/i],
};

function detectIntent(text: string): string {
  const t = text.trim();
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some(p => p.test(t))) return intent;
  }
  return 'UNKNOWN';
}

// ── Menu texts ────────────────────────────────────────────────────────────────
function mainMenu(facilityName: string): string {
  return `Welcome to *${facilityName}* 🏥\n\nHow can I help you today?\n\n1️⃣ Book Appointment\n2️⃣ Download Lab Report\n3️⃣ Pay Bill\n4️⃣ View Prescription\n5️⃣ My Health Records\n6️⃣ Talk to Staff\n\nReply with a number or type your query.`;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ── Main entry point ────────────────────────────────────────────────────────

  async handleMessage(
    tenantId: string,
    conversationId: string,
    patientPhone: string,
    messageText: string,
    patientId?: string,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, waPhoneNumberId: true, waAccessToken: true },
    });
    if (!tenant) return;

    const facilityName = tenant.name;
    const text = messageText.trim();

    // Load current chatbot state
    let state = await this.prisma.chatbotState.findUnique({
      where: { conversationId },
    });

    // Check if state has expired (30 min inactivity)
    if (state && new Date() > state.expiresAt) {
      await this.prisma.chatbotState.delete({ where: { conversationId } });
      state = null;
    }

    const stateData = (state?.data as any) || {};
    const currentFlow = state?.flow;
    const currentStep = state?.step;

    // ── If mid-flow, continue that flow ────────────────────────────────────────
    if (currentFlow && currentStep) {
      await this.continueFlow(tenantId, conversationId, patientPhone, patientId,
        text, currentFlow, currentStep, stateData, facilityName);
      return;
    }

    // ── Detect intent from fresh message ───────────────────────────────────────
    let intent = detectIntent(text);

    // Handle numeric shortcuts from main menu
    if (/^[1-6]$/.test(text)) {
      const menuMap: Record<string, string> = {
        '1': 'BOOKING', '2': 'REPORT', '3': 'BILLING',
        '4': 'PRESCRIPTION', '5': 'RECORDS', '6': 'HUMAN',
      };
      intent = menuMap[text] || intent;
    }

    this.logger.log(`Intent: ${intent} | tenant: ${tenantId} | msg: "${text.substring(0, 40)}"`);

    switch (intent) {
      case 'GREETING':
        await this.sendReply(tenantId, patientPhone, mainMenu(facilityName));
        break;

      case 'EMERGENCY':
        await this.handleEmergency(tenantId, patientPhone, conversationId, facilityName);
        break;

      case 'HUMAN':
        await this.escalateToHuman(tenantId, patientPhone, conversationId);
        break;

      case 'BOOKING':
        await this.startBookingFlow(tenantId, conversationId, patientPhone, facilityName);
        break;

      case 'REPORT':
        await this.startReportFlow(tenantId, conversationId, patientPhone, patientId, facilityName);
        break;

      case 'BILLING':
        await this.startBillingFlow(tenantId, conversationId, patientPhone, patientId, facilityName);
        break;

      case 'PRESCRIPTION':
        await this.startPrescriptionFlow(tenantId, conversationId, patientPhone, patientId, facilityName);
        break;

      case 'RECORDS':
        await this.handleRecords(tenantId, patientPhone, patientId, facilityName);
        break;

      case 'BOOK_NOW':
        await this.startBookingFlow(tenantId, conversationId, patientPhone, facilityName);
        break;

      case 'REMIND_LATER':
        await this.sendReply(tenantId, patientPhone,
          `No problem! We will remind you again in 7 days. Have a great day! 😊`);
        break;

      case 'NOT_NEEDED':
        await this.sendReply(tenantId, patientPhone,
          `Glad to hear that! Stay healthy. Feel free to message us anytime you need. 😊`);
        break;

      default:
        // Unknown intent — show menu or escalate
        if (text.length > 3) {
          await this.sendReply(tenantId, patientPhone,
            `I am not sure I understood that. Let me show you what I can help with:\n\n${mainMenu(facilityName)}`);
        }
    }
  }

  // ── BOOKING FLOW ────────────────────────────────────────────────────────────

  private async startBookingFlow(
    tenantId: string, conversationId: string,
    patientPhone: string, facilityName: string,
  ) {
    // Load departments
    const depts = await this.prisma.department.findMany({
      where: { tenantId, isActive: true, type: 'clinical' },
      orderBy: { name: 'asc' },
      take: 10,
    });

    if (depts.length === 0) {
      await this.sendReply(tenantId, patientPhone,
        `*Appointment Booking* 📅\n\nOur team will contact you to schedule an appointment. Please share your preferred date and time.`);
      await this.escalateToHuman(tenantId, patientPhone, conversationId);
      return;
    }

    const deptList = depts.map((d, i) => `${i + 1}️⃣ ${d.name}`).join('\n');
    const msg = `*Book an Appointment* 📅\n\nPlease choose a department:\n\n${deptList}\n\nReply with the number.`;

    await this.sendReply(tenantId, patientPhone, msg);
    await this.saveState(conversationId, tenantId, 'BOOKING', 'DEPT_SELECT', { depts: depts.map(d => ({ id: d.id, name: d.name })) });
  }

  private async continueFlow(
    tenantId: string, conversationId: string, patientPhone: string, patientId: string | undefined,
    text: string, flow: string, step: string, data: any, facilityName: string,
  ) {
    if (flow === 'BOOKING') await this.continueBooking(tenantId, conversationId, patientPhone, text, step, data, facilityName);
    else if (flow === 'REPORT') await this.continueReport(tenantId, conversationId, patientPhone, patientId, text, step, data);
    else if (flow === 'BILLING') await this.continueBilling(tenantId, conversationId, patientPhone, patientId, text, step, data);
    else {
      await this.clearState(conversationId);
      await this.sendReply(tenantId, patientPhone, `Something went wrong. Let me restart.\n\n${mainMenu(facilityName)}`);
    }
  }

  private async continueBooking(
    tenantId: string, conversationId: string, patientPhone: string,
    text: string, step: string, data: any, facilityName: string,
  ) {
    if (step === 'DEPT_SELECT') {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= (data.depts?.length || 0)) {
        await this.sendReply(tenantId, patientPhone, `Please reply with a valid number (1-${data.depts?.length || 1}).`);
        return;
      }
      const selectedDept = data.depts[num];

      // Load doctors in this department
      const doctors = await this.prisma.doctor.findMany({
        where: { tenantId, departmentId: selectedDept.id, isAvailable: true },
        include: { user: { select: { firstName: true, lastName: true } } },
        take: 8,
      });

      if (doctors.length === 0) {
        await this.sendReply(tenantId, patientPhone,
          `No doctors are currently available in ${selectedDept.name}. Our team will contact you to schedule.\n\nFor urgent needs, please call us directly.`);
        await this.escalateToHuman(tenantId, patientPhone, conversationId);
        return;
      }

      const docList = doctors.map((d, i) =>
        `${i + 1}️⃣ Dr. ${d.user.firstName} ${d.user.lastName || ''} — ₹${d.consultationFee ? d.consultationFee / 100 : '—'}`
      ).join('\n');

      await this.sendReply(tenantId, patientPhone,
        `*${selectedDept.name}* Department\n\nAvailable Doctors:\n\n${docList}\n\nReply with the number.`);
      await this.saveState(conversationId, tenantId, 'BOOKING', 'DOCTOR_SELECT',
        { ...data, deptId: selectedDept.id, deptName: selectedDept.name, doctors: doctors.map(d => ({ id: d.id, name: `Dr. ${d.user.firstName} ${d.user.lastName || ''}`, fee: d.consultationFee, slotDuration: d.slotDuration })) });
      return;
    }

    if (step === 'DOCTOR_SELECT') {
      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= (data.doctors?.length || 0)) {
        await this.sendReply(tenantId, patientPhone, `Please reply with a valid number (1-${data.doctors?.length || 1}).`);
        return;
      }
      const selectedDoc = data.doctors[num];

      // Generate next available slots (next 3 days, hourly from 9am-6pm)
      const slots = this.generateSlots(3);
      const slotList = slots.map((s, i) => `${i + 1}️⃣ ${s.label}`).join('\n');

      await this.sendReply(tenantId, patientPhone,
        `*${selectedDoc.name}*\nConsultation Fee: ₹${selectedDoc.fee ? selectedDoc.fee / 100 : 'Varies'}\n\nAvailable slots:\n\n${slotList}\n\nReply with the slot number or tell us your preferred date/time.`);
      await this.saveState(conversationId, tenantId, 'BOOKING', 'SLOT_SELECT',
        { ...data, doctorId: selectedDoc.id, doctorName: selectedDoc.name, doctorFee: selectedDoc.fee, slots });
      return;
    }

    if (step === 'SLOT_SELECT') {
      const num = parseInt(text) - 1;
      let selectedSlot = data.slots?.[num];

      if (!selectedSlot && text.length > 3) {
        // Patient typed a custom time — use first available slot as fallback, flag for human
        selectedSlot = { label: text, iso: new Date(Date.now() + 86400000).toISOString() };
      }

      if (!selectedSlot) {
        await this.sendReply(tenantId, patientPhone, `Please reply with a valid slot number (1-${data.slots?.length || 1}).`);
        return;
      }

      await this.sendReply(tenantId, patientPhone,
        `Please confirm your appointment:\n\n👨‍⚕️ ${data.doctorName}\n🏥 ${data.deptName}\n📅 ${selectedSlot.label}\n💰 ₹${data.doctorFee ? data.doctorFee / 100 : 'Varies'}\n\nReply *CONFIRM* to book or *CANCEL* to go back.`);
      await this.saveState(conversationId, tenantId, 'BOOKING', 'CONFIRM',
        { ...data, slotIso: selectedSlot.iso, slotLabel: selectedSlot.label });
      return;
    }

    if (step === 'CONFIRM') {
      const intent = detectIntent(text);
      if (intent === 'CONFIRM' || text.toLowerCase() === 'confirm') {
        // Create appointment
        try {
          const patient = await this.prisma.patient.findFirst({
            where: { tenantId, phone: { contains: patientPhone.slice(-10) }, deletedAt: null },
          });

          if (!patient) {
            await this.sendReply(tenantId, patientPhone,
              `To complete your booking, please visit our reception or call us to register your details first. Your appointment will be confirmed within 2 hours.`);
            await this.escalateToHuman(tenantId, patientPhone, conversationId);
            await this.clearState(conversationId);
            return;
          }

          const appt = await this.prisma.appointment.create({
            data: {
              tenantId,
              patientId: patient.id,
              doctorId: data.doctorId,
              departmentId: data.deptId,
              scheduledAt: new Date(data.slotIso),
              type: 'SCHEDULED',
              status: 'CONFIRMED',
              source: 'whatsapp',
              tokenNumber: `WA-${Date.now().toString().slice(-4)}`,
            },
          });

          await this.sendReply(tenantId, patientPhone,
            `✅ *Appointment Confirmed!*\n\n👨‍⚕️ ${data.doctorName}\n🏥 ${data.deptName}\n📅 ${data.slotLabel}\n🎫 Token: ${appt.tokenNumber}\n\nPlease arrive 10 minutes early. We look forward to seeing you!`);

          await this.clearState(conversationId);
        } catch (err) {
          this.logger.error(`Appointment creation failed: ${err}`);
          await this.sendReply(tenantId, patientPhone,
            `There was an issue confirming your booking. Our team will contact you shortly to confirm.`);
          await this.escalateToHuman(tenantId, patientPhone, conversationId);
          await this.clearState(conversationId);
        }
      } else {
        await this.sendReply(tenantId, patientPhone, `Booking cancelled. How else can I help you?\n\n${mainMenu(facilityName)}`);
        await this.clearState(conversationId);
      }
      return;
    }
  }

  // ── REPORT FLOW ─────────────────────────────────────────────────────────────

  private async startReportFlow(
    tenantId: string, conversationId: string, patientPhone: string,
    patientId: string | undefined, facilityName: string,
  ) {
    if (!patientId) {
      await this.sendReply(tenantId, patientPhone,
        `To retrieve your reports, we need to verify your identity. Please share your *Health ID* (format: HB-XXXXXXXX) or visit our reception.`);
      await this.saveState(conversationId, tenantId, 'REPORT', 'VERIFY_ID', {});
      return;
    }

    const reports = await this.prisma.labOrder.findMany({
      where: { tenantId, patientId, status: { in: ['COMPLETED', 'DELIVERED'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (reports.length === 0) {
      await this.sendReply(tenantId, patientPhone,
        `No completed lab reports found for your account. If you recently had tests done, results may still be processing.\n\nReply *HELP* to speak with our staff.`);
      return;
    }

    const reportList = reports.map((r, i) =>
      `${i + 1}️⃣ ${r.orderNumber} — ${new Date(r.createdAt).toLocaleDateString('en-IN')}`
    ).join('\n');

    await this.sendReply(tenantId, patientPhone,
      `*Your Lab Reports* 📋\n\n${reportList}\n\nReply with the number to download, or *ALL* for all reports.`);
    await this.saveState(conversationId, tenantId, 'REPORT', 'SELECT_REPORT',
      { reports: reports.map(r => ({ id: r.id, orderNumber: r.orderNumber, reportUrl: r.reportUrl })) });
  }

  private async continueReport(
    tenantId: string, conversationId: string, patientPhone: string,
    patientId: string | undefined, text: string, step: string, data: any,
  ) {
    if (step === 'SELECT_REPORT') {
      const num = parseInt(text) - 1;
      const allMatch = text.toLowerCase() === 'all';

      if (allMatch) {
        const reports = data.reports.filter((r: any) => r.reportUrl);
        if (reports.length === 0) {
          await this.sendReply(tenantId, patientPhone, `No downloadable reports found. Please contact our lab staff.`);
        } else {
          for (const report of reports) {
            await this.sendReply(tenantId, patientPhone,
              `📄 Report: ${report.orderNumber}\n${report.reportUrl}`);
          }
          await this.sendReply(tenantId, patientPhone, `All your reports have been sent. Stay healthy! 💙`);
        }
        await this.clearState(conversationId);
        return;
      }

      if (!isNaN(num) && num >= 0 && num < (data.reports?.length || 0)) {
        const report = data.reports[num];
        if (report.reportUrl) {
          await this.sendReply(tenantId, patientPhone,
            `📄 *Your Report is Ready*\n\nOrder: ${report.orderNumber}\n\n${report.reportUrl}\n\nThis link is valid for 7 days. Have a great day! 💙`);
        } else {
          await this.sendReply(tenantId, patientPhone,
            `Your report for order ${report.orderNumber} is being processed. We will send it to you on WhatsApp as soon as it is ready.`);
        }
        await this.clearState(conversationId);
        return;
      }

      await this.sendReply(tenantId, patientPhone, `Please reply with a valid number or ALL.`);
    }
  }

  // ── BILLING FLOW ────────────────────────────────────────────────────────────

  private async startBillingFlow(
    tenantId: string, conversationId: string, patientPhone: string,
    patientId: string | undefined, facilityName: string,
  ) {
    if (!patientId) {
      await this.sendReply(tenantId, patientPhone,
        `To view your bill, I need to find your account. Please share your *Health ID* (HB-XXXXXXXX) or registered phone number.`);
      return;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, patientId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (invoices.length === 0) {
      await this.sendReply(tenantId, patientPhone,
        `✅ No pending bills found for your account. All payments are up to date!\n\nIs there anything else I can help you with?`);
      return;
    }

    const billList = invoices.map((inv, i) =>
      `${i + 1}️⃣ Invoice ${inv.invoiceNumber} — ₹${inv.dueAmount / 100} due`
    ).join('\n');

    await this.sendReply(tenantId, patientPhone,
      `*Your Pending Bills* 💰\n\n${billList}\n\nReply with the number to pay that invoice.`);
    await this.saveState(conversationId, tenantId, 'BILLING', 'SELECT_INVOICE',
      { invoices: invoices.map(i => ({ id: i.id, invoiceNumber: i.invoiceNumber, dueAmount: i.dueAmount })) });
  }

  private async continueBilling(
    tenantId: string, conversationId: string, patientPhone: string,
    patientId: string | undefined, text: string, step: string, data: any,
  ) {
    if (step === 'SELECT_INVOICE') {
      const num = parseInt(text) - 1;
      if (!isNaN(num) && num >= 0 && num < (data.invoices?.length || 0)) {
        const invoice = data.invoices[num];
        // In production: generate Razorpay payment link here
        const paymentLink = `https://pay.hospibot.in/invoice/${invoice.id}`;
        await this.sendReply(tenantId, patientPhone,
          `💳 *Payment Link*\n\nInvoice: ${invoice.invoiceNumber}\nAmount: ₹${invoice.dueAmount / 100}\n\nPay securely via UPI / Card / Net Banking:\n${paymentLink}\n\n_This link expires in 24 hours._`);
        await this.clearState(conversationId);
        return;
      }
      await this.sendReply(tenantId, patientPhone, `Please reply with a valid number.`);
    }
  }

  // ── PRESCRIPTION FLOW ───────────────────────────────────────────────────────

  private async startPrescriptionFlow(
    tenantId: string, conversationId: string, patientPhone: string,
    patientId: string | undefined, facilityName: string,
  ) {
    if (!patientId) {
      await this.sendReply(tenantId, patientPhone, `Please share your Health ID (HB-XXXXXXXX) to retrieve your prescriptions.`);
      return;
    }

    const rxList = await this.prisma.prescription.findMany({
      where: { tenantId, patientId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (rxList.length === 0) {
      await this.sendReply(tenantId, patientPhone, `No active prescriptions found. Please consult your doctor for a new prescription.`);
      return;
    }

    for (const rx of rxList) {
      const meds = (rx.medications as any[]) || [];
      const medList = meds.map(m => `• ${m.name} — ${m.dosage || ''} ${m.frequency || ''} for ${m.duration || ''}`).join('\n');
      await this.sendReply(tenantId, patientPhone,
        `💊 *Prescription* (${new Date(rx.createdAt).toLocaleDateString('en-IN')})\n\n${medList}${rx.refillDueDate ? `\n\n⏰ Refill due: ${new Date(rx.refillDueDate).toLocaleDateString('en-IN')}` : ''}`);
    }

    await this.sendReply(tenantId, patientPhone, `Above are your active prescriptions. For refills, reply *REFILL* or visit our pharmacy.`);
  }

  // ── RECORDS ─────────────────────────────────────────────────────────────────

  private async handleRecords(
    tenantId: string, patientPhone: string, patientId: string | undefined, facilityName: string,
  ) {
    if (!patientId) {
      await this.sendReply(tenantId, patientPhone,
        `To view your health records, please share your *Health ID* (HB-XXXXXXXX) or your registered phone number.`);
      return;
    }

    const [visits, appts, rxCount, labCount] = await Promise.all([
      this.prisma.visit.count({ where: { patientId } }),
      this.prisma.appointment.findFirst({
        where: { tenantId, patientId, scheduledAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: { scheduledAt: 'asc' },
        include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.prescription.count({ where: { tenantId, patientId, isActive: true } }),
      this.prisma.labOrder.count({ where: { tenantId, patientId } }),
    ]);

    let summary = `*Your Health Summary* 📋\n\n`;
    summary += `🏥 Total Visits: ${visits}\n`;
    summary += `💊 Active Prescriptions: ${rxCount}\n`;
    summary += `🧪 Lab Orders: ${labCount}\n`;

    if (appts) {
      const doc = appts.doctor?.user;
      summary += `\n📅 *Next Appointment*\n${new Date(appts.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} with Dr. ${doc?.firstName} ${doc?.lastName || ''}`;
    }

    summary += `\n\nWhat would you like?\n1️⃣ Lab Reports\n2️⃣ Prescriptions\n3️⃣ Bills\n4️⃣ Book Appointment`;
    await this.sendReply(tenantId, patientPhone, summary);
  }

  // ── EMERGENCY ───────────────────────────────────────────────────────────────

  private async handleEmergency(
    tenantId: string, patientPhone: string, conversationId: string, facilityName: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { phone: true, settings: true },
    });

    await this.sendReply(tenantId, patientPhone,
      `🚨 *EMERGENCY DETECTED*\n\nThis sounds like it requires immediate attention.\n\n📞 Call our emergency line: ${tenant?.phone || 'Our main number'}\n\nOr go directly to our Emergency Department.\n\nConnecting you with our staff right now...`);

    await this.escalateToHuman(tenantId, patientPhone, conversationId, 'URGENT');
  }

  // ── ESCALATION ──────────────────────────────────────────────────────────────

  private async escalateToHuman(
    tenantId: string, patientPhone: string, conversationId: string, priority = 'NORMAL',
  ) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBot: false },
    });

    if (priority === 'URGENT') {
      // TODO: Send push notification to reception staff
      this.logger.warn(`URGENT escalation for tenant ${tenantId} from ${patientPhone}`);
    }

    await this.sendReply(tenantId, patientPhone,
      `I am connecting you with our team right now. Please hold for a moment. Our staff will respond shortly. 🙏`);

    await this.clearState(conversationId);
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  private generateSlots(days: number): { label: string; iso: string }[] {
    const slots: { label: string; iso: string }[] = [];
    const now = new Date();

    for (let day = 1; day <= days; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      const dayLabel = day === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

      for (const hour of [9, 10, 11, 14, 15, 16, 17]) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
        slots.push({
          label: `${dayLabel} ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          iso: slotDate.toISOString(),
        });
        if (slots.length >= 9) return slots;
      }
    }
    return slots;
  }

  private async sendReply(tenantId: string, to: string, message: string) {
    await this.whatsappService.sendTextMessage(tenantId, to, message);
  }

  private async saveState(
    conversationId: string, tenantId: string, flow: string, step: string, data: any,
  ) {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await this.prisma.chatbotState.upsert({
      where: { conversationId },
      create: { conversationId, tenantId, flow, step, data, expiresAt },
      update: { flow, step, data, expiresAt },
    });
  }

  private async clearState(conversationId: string) {
    await this.prisma.chatbotState.deleteMany({ where: { conversationId } }).catch(() => {});
  }
}
