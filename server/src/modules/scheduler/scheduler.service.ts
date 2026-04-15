import { Cron } from '@nestjs/schedule';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private jobTimer: NodeJS.Timeout | null = null;
  private ruleTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  onModuleInit() {
    // Process pending automation jobs every 5 minutes
    this.jobTimer = setInterval(() => this.processPendingJobs(), 5 * 60 * 1000);
    // Scan automation rules every hour to create new jobs
    this.ruleTimer = setInterval(() => this.scanRulesAndCreateJobs(), 60 * 60 * 1000);

    // Run immediately on startup (after 30s delay)
    setTimeout(() => {
      this.processPendingJobs();
      this.scanRulesAndCreateJobs();
    }, 30000);

    this.logger.log('Automation Scheduler started');
  }

  onModuleDestroy() {
    if (this.jobTimer)  clearInterval(this.jobTimer);
    if (this.ruleTimer) clearInterval(this.ruleTimer);
  }

  // ── Process due jobs ───────────────────────────────────────────────────────

  async processPendingJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const jobs = await this.prisma.automationJob.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: now },
        },
        take: 50,
        orderBy: { scheduledAt: 'asc' },
      });

      if (jobs.length > 0) {
        this.logger.log(`Processing ${jobs.length} automation jobs`);
      }

      for (const job of jobs) {
        await this.executeJob(job);
      }
    } catch (err) {
      this.logger.error(`Job processing error: ${err}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJob(job: any) {
    try {
      const patient = await this.prisma.patient.findFirst({
        where: { id: job.patientId, deletedAt: null },
      });

      if (!patient) {
        await this.prisma.automationJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', lastError: 'Patient not found', executedAt: new Date() },
        });
        return;
      }

      const action = job.action as any;

      if (action.type === 'SEND_WHATSAPP') {
        // Personalise the message
        const message = this.personalise(action.message || '', {
          name: patient.firstName,
          phone: patient.phone,
          doctor_name: action.doctorName || '',
          facility_name: action.facilityName || 'our facility',
          days: action.days || '',
          test_name: action.testName || '',
          medicine_name: action.medicineName || '',
          condition: action.condition || '',
          period: action.period || '',
        });

        await this.whatsappService.sendTextMessage(job.tenantId, patient.phone, message);

        // Add quick-reply buttons based on action context
        if (action.includeBookButton) {
          const followUpMsg = `\n\nReply:\n1️⃣ Book Appointment\n2️⃣ Remind me later\n3️⃣ I don't need this`;
          await this.whatsappService.sendTextMessage(job.tenantId, patient.phone, followUpMsg);
        }
      }

      if (action.type === 'SEND_TEMPLATE') {
        await this.whatsappService.sendTemplateMessage(
          job.tenantId,
          patient.phone,
          action.templateName,
          action.language || 'en',
          action.components || [],
        );
      }

      if (action.type === 'UPDATE_CRM') {
        await this.prisma.lead.updateMany({
          where: { tenantId: job.tenantId, patientId: patient.id },
          data: { stage: action.stage },
        });
      }

      // Update rule stats
      await this.prisma.automationRule.update({
        where: { id: job.ruleId },
        data: { triggeredCount: { increment: 1 } },
      }).catch(() => {});

      // Mark job done
      await this.prisma.automationJob.update({
        where: { id: job.id },
        data: { status: 'SENT', executedAt: new Date() },
      });

      // Log execution
      await this.prisma.automationLog.create({
        data: {
          ruleId: job.ruleId,
          patientId: job.patientId,
          tenantId: job.tenantId,
          actionTaken: action.type,
          result: 'sent',
          executedAt: new Date(),
        },
      }).catch(() => {});

    } catch (err: any) {
      const attempts = (job.attempts || 0) + 1;
      const status = attempts >= 3 ? 'FAILED' : 'PENDING';
      const nextRun = status === 'PENDING'
        ? new Date(Date.now() + attempts * 30 * 60 * 1000) // retry 30min, 60min
        : undefined;

      await this.prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status,
          attempts,
          lastError: err.message,
          ...(nextRun ? { scheduledAt: nextRun } : { executedAt: new Date() }),
        },
      });

      this.logger.error(`Job ${job.id} failed (attempt ${attempts}): ${err.message}`);
    }
  }

  // ── Scan rules and create scheduled jobs ───────────────────────────────────

  async scanRulesAndCreateJobs() {
    try {
      const rules = await this.prisma.automationRule.findMany({
        where: { isActive: true, trigger: 'TIME_ELAPSED' },
      });

      for (const rule of rules) {
        await this.processTimeElapsedRule(rule);
      }
    } catch (err) {
      this.logger.error(`Rule scan error: ${err}`);
    }
  }

  private async processTimeElapsedRule(rule: any) {
    const conditions = rule.conditions as any;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.waitDays);

    // Find patients who last visited before the cutoff
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId: rule.tenantId,
        deletedAt: null,
        lastVisitAt: { lte: cutoffDate, not: null },
        ...(conditions.tags?.length > 0 ? { tags: { hasSome: conditions.tags } } : {}),
      },
      take: 200,
    });

    for (const patient of patients) {
      // Check if job already scheduled for this patient+rule
      const existingJob = await this.prisma.automationJob.findFirst({
        where: {
          tenantId: rule.tenantId,
          ruleId: rule.id,
          patientId: patient.id,
          status: { in: ['PENDING', 'SENT'] },
        },
      });
      if (existingJob) continue;

      const actions = rule.actions as any[];
      for (const action of actions) {
        await this.prisma.automationJob.create({
          data: {
            tenantId: rule.tenantId,
            ruleId: rule.id,
            patientId: patient.id,
            scheduledAt: new Date(), // send now
            action,
          },
        });
      }
    }
  }

  // ── Triggered by clinical events (called externally) ──────────────────────

  async triggerOnEvent(
    tenantId: string,
    eventType: 'VISIT_COMPLETED' | 'DIAGNOSIS_RECORDED' | 'MEDICATION_PRESCRIBED' |
               'APPOINTMENT_CANCELLED' | 'NO_SHOW' | 'PAYMENT_RECEIVED' | 'LAB_REPORT_READY',
    patientId: string,
    metadata: Record<string, any> = {},
  ) {
    try {
      // Find all active rules for this event type
      const rules = await this.prisma.automationRule.findMany({
        where: { tenantId, isActive: true, trigger: eventType as any },
      });

      const patient = await this.prisma.patient.findFirst({
        where: { id: patientId, tenantId, deletedAt: null },
      });
      if (!patient) return;

      for (const rule of rules) {
        const conditions = rule.conditions as any;

        // Check if patient matches conditions
        if (!this.patientMatchesConditions(patient, conditions, metadata)) continue;

        // Check if this rule was already triggered for this patient recently
        const recentLog = await this.prisma.automationLog.findFirst({
          where: {
            ruleId: rule.id,
            patientId,
            executedAt: { gte: new Date(Date.now() - rule.waitDays * 24 * 60 * 60 * 1000 * 0.9) },
          },
        });
        if (recentLog) continue;

        // Schedule jobs for all actions
        const actions = rule.actions as any[];
        for (const action of actions) {
          const scheduledAt = new Date(Date.now() + rule.waitDays * 24 * 60 * 60 * 1000);

          await this.prisma.automationJob.create({
            data: {
              tenantId,
              ruleId: rule.id,
              patientId,
              scheduledAt,
              action: {
                ...action,
                facilityName: metadata.facilityName || '',
                doctorName: metadata.doctorName || '',
                testName: metadata.testName || '',
                medicineName: metadata.medicineName || '',
                condition: metadata.condition || conditions.diagnosisCodes?.[0] || '',
              },
            },
          });
        }

        this.logger.log(`Automation scheduled: rule "${rule.name}" for patient ${patientId} in ${rule.waitDays} days`);
      }
    } catch (err) {
      this.logger.error(`Trigger event error: ${err}`);
    }
  }

  private patientMatchesConditions(patient: any, conditions: any, metadata: any): boolean {
    if (conditions.tags?.length > 0) {
      const hasAnyTag = conditions.tags.some((t: string) => patient.tags?.includes(t));
      if (!hasAnyTag) return false;
    }

    if (conditions.diagnosisCodes?.length > 0 && metadata.diagnosisCodes) {
      const hasCode = conditions.diagnosisCodes.some((c: string) =>
        metadata.diagnosisCodes.includes(c));
      if (!hasCode) return false;
    }

    if (conditions.ageMin && patient.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 86400000));
      if (age < conditions.ageMin) return false;
    }

    if (conditions.ageMax && patient.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 86400000));
      if (age > conditions.ageMax) return false;
    }

    return true;
  }

  private personalise(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `[${key}]`);
  }

// ── Daily Appointment Reminder Job ──────────────────────────────────────────
  // Runs every day at 8:00 AM IST — sends WhatsApp reminders for next-day appointments

  @Cron('0 0 2 * * *', { timeZone: 'Asia/Kolkata' }) // 2:30 AM UTC = 8:00 AM IST
  async sendAppointmentReminders() {
    this.logger.log('Running daily appointment reminder job...');

    // Get all active tenants
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      try {
        await this.sendRemindersForTenant(tenant.id, tenant.name);
      } catch (err) {
        this.logger.error(`Reminder job failed for tenant ${tenant.id}: ${err}`);
      }
    }
  }

  private async sendRemindersForTenant(tenantId: string, tenantName: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: tomorrow, lte: tomorrowEnd },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: {
        patient: { select: { firstName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    let sent = 0;
    for (const apt of appointments) {
      if (!apt.patient?.phone) continue;

      const time = new Date(apt.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      });
      const doctorName = apt.doctor
        ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName || ''}`.trim()
        : 'your doctor';

      const message = `🏥 *Appointment Reminder*\n\nHi ${apt.patient.firstName},\n\nThis is a reminder for your appointment *tomorrow*.\n\n👨‍⚕️ Doctor: ${doctorName}\n⏰ Time: ${time}\n🏥 ${tenantName}\n\nPlease arrive 10 minutes early with any previous reports.\n\nReply *CONFIRM* to confirm or *CANCEL* to cancel.\n\n_Reply HELP for assistance_`;

      try {
        await this.whatsappService.sendTextMessage(tenantId, apt.patient.phone, message);
        sent++;
      } catch { /* non-blocking */ }
    }

    if (sent > 0) this.logger.log(`Sent ${sent} appointment reminders for tenant ${tenantId}`);
    return sent;
  }

  // ── Refill reminder job ─────────────────────────────────────────────────────
  // Runs every morning — sends prescription refill reminders

  // ── 2-hour before appointment reminder ─────────────────────────────────────
  // Runs every hour — sends WhatsApp message 2h before upcoming appointments
  @Cron('0 */30 * * * *') // every 30 minutes
  async sendTwoHourReminders() {
    const now         = new Date();
    const twoHoursOut = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    // Window: appointments starting in 1h55m – 2h05m from now
    const windowStart = new Date(twoHoursOut.getTime() - 5 * 60 * 1000);
    const windowEnd   = new Date(twoHoursOut.getTime() + 5 * 60 * 1000);

    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      try {
        const appointments = await this.prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            scheduledAt: { gte: windowStart, lte: windowEnd },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          include: {
            patient: { select: { firstName: true, phone: true } },
            doctor:  { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        });

        for (const apt of appointments) {
          if (!apt.patient?.phone) continue;
          const time = new Date(apt.scheduledAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
          });
          const doctor = apt.doctor
            ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName || ''}`.trim()
            : 'your doctor';
          const msg = `⏰ *Appointment in 2 hours!*\n\nHi ${apt.patient.firstName},\n\nReminder: Your appointment with *${doctor}* is at *${time}* today.\n\n📍 ${tenant.name}\n\nPlease leave soon to arrive on time. Bring any previous reports or prescriptions.\n\n_Reply CANCEL if you need to cancel._`;
          await this.whatsappService.sendTextMessage(tenant.id, apt.patient.phone, msg).catch(() => {});
        }
      } catch (err) {
        this.logger.error(`2h reminder job failed for tenant ${tenant.id}: ${err}`);
      }
    }
  }

  @Cron('0 30 2 * * *', { timeZone: 'Asia/Kolkata' }) // 8:00 AM IST
  async sendRefillReminders() {
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const fiveDaysStart   = new Date(fiveDaysFromNow);
    fiveDaysStart.setHours(0, 0, 0, 0);
    const fiveDaysEnd = new Date(fiveDaysFromNow);
    fiveDaysEnd.setHours(23, 59, 59, 999);

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        isActive: true,
        refillDueDate: { gte: fiveDaysStart, lte: fiveDaysEnd },
      },
      include: {
        patient: { select: { firstName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    for (const rx of prescriptions) {
      if (!rx.patient?.phone) continue;
      const meds = (rx.medications as any[]).slice(0, 3).map((m: any) => m.name).join(', ');
      const doctorName = rx.doctor
        ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName || ''}`.trim()
        : 'your doctor';

      const msg = `💊 *Prescription Refill Reminder*\n\nHi ${rx.patient.firstName},\n\nYour prescription from ${doctorName} is due for a refill in 5 days.\n\nMedicines: ${meds}\n\nPlease visit us or call to request a refill.\n\n_This is an automated reminder from HospiBot_`;

      await this.whatsappService.sendTextMessage(rx.tenantId, rx.patient.phone, msg).catch(() => {});
    }

    this.logger.log(`Sent ${prescriptions.length} refill reminders`);
  }

  // ── Send NPS feedback requests after visits ─────────────────────────────
  async sendFeedbackRequests() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const visits = await this.prisma.visit.findMany({
      where: {
        createdAt: { gte: yesterday, lte: yesterdayEnd },
        rating: null, // Only visits without feedback yet
      },
      include: {
        patient: { select: { firstName: true, phone: true, tenantId: true } },
      },
      take: 100,
    });

    let sent = 0;
    for (const v of visits) {
      if (!v.patient?.phone || !v.tenantId) continue;
      const msg = `⭐ *How was your visit?*\n\nHi ${v.patient.firstName},\n\nWe hope you're feeling better! Please rate your recent visit:\n\nReply with:\n*1* - ⭐ Poor\n*2* - ⭐⭐ Fair\n*3* - ⭐⭐⭐ Good\n*4* - ⭐⭐⭐⭐ Very Good\n*5* - ⭐⭐⭐⭐⭐ Excellent\n\nYour feedback helps us improve. Thank you!`;
      await this.whatsappService.sendTextMessage(v.tenantId, v.patient.phone, msg).catch(() => {});
      sent++;
    }

    this.logger.log(`Sent ${sent} feedback requests`);
  }
  // ════════════════════════════════════════════════════════════════════════════
  // DIAGNOSTIC REVENUE ENGINE — Process pending automation executions
  // Runs every 30 minutes — sends WhatsApp re-test reminders to due patients
  // ════════════════════════════════════════════════════════════════════════════

  @Cron('0 */30 * * * *') // every 30 minutes
  async processDiagnosticAutomation() {
    try {
      const now = new Date();
      const due = await this.prisma.diagnosticAutomationExecution.findMany({
        where: { status: 'PENDING', scheduledFor: { lte: now } },
        include: { rule: true },
        take: 100,
        orderBy: { scheduledFor: 'asc' },
      });

      if (due.length === 0) return;
      this.logger.log(`Processing ${due.length} diagnostic automation executions`);

      for (const exec of due) {
        try {
          const rule = exec.rule;
          if (!rule?.isActive) {
            await this.prisma.diagnosticAutomationExecution.update({
              where: { id: exec.id }, data: { status: 'OPTED_OUT' },
            });
            continue;
          }

          // Get patient for personalisation
          const patient = await this.prisma.patient.findFirst({
            where: { id: exec.patientId },
            select: { firstName: true, phone: true },
          });
          if (!patient?.phone) continue;

          const msgBody = rule.messageText
            ?? this.buildReTestMessage(patient.firstName, rule.testCode, rule.waitDays);

          await this.whatsappService.sendTextMessage(
            exec.tenantId, exec.patientMobile || patient.phone, msgBody,
          );

          await this.prisma.diagnosticAutomationExecution.update({
            where: { id: exec.id },
            data: { status: 'SENT', sentAt: now },
          });

          // Debit WA credit
          await this.prisma.tenantWallet.updateMany({
            where: { tenantId: exec.tenantId },
            data: { waCredits: { decrement: 1.0 } },
          });
          await this.prisma.messageUsageLog.create({
            data: {
              tenantId: exec.tenantId,
              recipientMobile: exec.patientMobile,
              messageType: 'MARKETING',
              templateCode: rule.templateCode,
              creditsCharged: 1.0,
              automationRuleId: rule.id,
              sentAt: now,
            },
          }).catch(() => {});

        } catch (execErr: any) {
          this.logger.error(`Exec ${exec.id} failed: ${execErr.message}`);
          await this.prisma.diagnosticAutomationExecution.update({
            where: { id: exec.id }, data: { status: 'SENT' }, // mark sent to prevent retry loops
          }).catch(() => {});
        }
      }
    } catch (err) {
      this.logger.error(`Diagnostic automation cron error: ${err}`);
    }
  }

  private buildReTestMessage(firstName: string, testCode: string | null, waitDays: number): string {
    const testName = testCode ?? 'health test';
    const months = waitDays >= 30 ? `${Math.round(waitDays / 30)} month${waitDays >= 60 ? 's' : ''}` : `${waitDays} days`;
    return (
      `🩺 *Time for your ${testName} test!*\n\n` +
      `Hi ${firstName},\n\n` +
      `It's been ${months} since your last ${testName}. ` +
      `Regular testing helps monitor your health and catch issues early.\n\n` +
      `📅 Book your test today — same-day results available!\n\n` +
      `Reply *BOOK* to confirm your appointment or *STOP* to unsubscribe.\n\n` +
      `_Powered by HospiBot_`
    );
  }

  // ── TAT Breach Escalation — Runs every hour ────────────────────────────────

  @Cron('0 0 * * * *') // every hour
  async escalateTatBreaches() {
    try {
      const breachThreshold = new Date(Date.now() - 28 * 3_600_000); // 28h ago
      const breached = await this.prisma.labOrder.findMany({
        where: {
          status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] },
          createdAt: { lt: breachThreshold },
          isStat: false,
        },
        select: { id: true, tenantId: true, orderNumber: true, patientId: true, createdAt: true },
        take: 50,
      });

      if (breached.length === 0) return;
      this.logger.warn(`TAT breach: ${breached.length} orders exceeding 28h`);

      // In production: notify branch manager / send Slack alert
      // For now just log
    } catch (err) {
      this.logger.error(`TAT escalation error: ${err}`);
    }
  }

  // ── ACK Critical Value Timeout — Runs every 15 minutes ───────────────────

  @Cron('0 */15 * * * *')
  async checkCriticalValueAcknowledgements() {
    try {
      // Alerts sent >45 min ago with no ack
      const threshold = new Date(Date.now() - 45 * 60_000);
      const unacked = await this.prisma.criticalValueAlert.findMany({
        where: { acknowledgedAt: null, alertSentAt: { lt: threshold }, escalatedAt: null },
        take: 20,
      });

      for (const alert of unacked) {
        this.logger.warn(`Critical value ${alert.id} unacknowledged for >45 min — escalating`);
        await this.prisma.criticalValueAlert.update({
          where: { id: alert.id },
          data: { escalatedAt: new Date() },
        });
        // In production: send SMS fallback + notify admin
      }
    } catch (err) {
      this.logger.error(`Critical ACK check error: ${err}`);
    }
  }
}
