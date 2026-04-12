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
}
