import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CreateRuleDto, UpdateRuleDto, ListRulesDto } from './dto/automation.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ==========================================
  // RULE MANAGEMENT
  // ==========================================

  async createRule(tenantId: string, dto: CreateRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger as any,
        conditions: dto.conditions,
        waitDays: dto.waitDays,
        actions: dto.actions,
        escalation: dto.escalation || {},
        isActive: true,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id, tenantId },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  async list(tenantId: string, query: ListRulesDto) {
    const { page = 1, limit = 20, activeOnly, trigger } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (activeOnly) where.isActive = true;
    if (trigger) where.trigger = trigger;

    const [data, total] = await Promise.all([
      this.prisma.automationRule.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.automationRule.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateRule(tenantId: string, id: string, dto: UpdateRuleDto) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return this.prisma.automationRule.update({ where: { id }, data: dto });
  }

  async toggleRule(tenantId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return this.prisma.automationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  // ==========================================
  // RULE EXECUTION ENGINE
  // ==========================================

  /**
   * Process all active rules for a tenant.
   * Called by a scheduled job (cron) or manually triggered.
   */
  async processRules(tenantId: string) {
    const rules = await this.prisma.automationRule.findMany({
      where: { tenantId, isActive: true },
    });

    let totalTriggered = 0;
    let totalSent = 0;

    for (const rule of rules) {
      const result = await this.executeRule(tenantId, rule);
      totalTriggered += result.matched;
      totalSent += result.sent;
    }

    return { rulesProcessed: rules.length, totalTriggered, totalSent };
  }

  /**
   * Execute a single automation rule
   */
  private async executeRule(tenantId: string, rule: any) {
    const conditions = rule.conditions as any;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.waitDays);

    // Find patients matching conditions who haven't been contacted by this rule recently
    const patients = await this.findMatchingPatients(tenantId, conditions, cutoffDate, rule.id);

    let sent = 0;
    for (const patient of patients) {
      try {
        // Execute actions
        for (const action of (rule.actions as any[])) {
          await this.executeAction(tenantId, patient, action, rule);
        }

        // Log the execution
        await this.prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            patientId: patient.id,
            tenantId,
            actionTaken: 'REMINDER_SENT',
            result: 'sent',
          },
        });

        // Update rule stats
        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: { triggeredCount: { increment: 1 } },
        });

        sent++;
      } catch (err) {
        this.logger.error(`Rule ${rule.id}: Failed for patient ${patient.id}: ${err}`);
        await this.prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            patientId: patient.id,
            tenantId,
            actionTaken: 'REMINDER_ATTEMPTED',
            result: 'failed',
          },
        });
      }
    }

    return { matched: patients.length, sent };
  }

  /**
   * Find patients matching rule conditions
   */
  private async findMatchingPatients(tenantId: string, conditions: any, cutoffDate: Date, ruleId: string) {
    const where: any = { tenantId, deletedAt: null };

    // Diagnosis-based matching
    if (conditions.diagnosisCodes?.length > 0) {
      where.visits = {
        some: {
          diagnosisCodes: { hasSome: conditions.diagnosisCodes },
        },
      };
    }

    // Tag-based matching
    if (conditions.tags?.length > 0) {
      where.tags = { hasEvery: conditions.tags };
    }

    // Last visit before cutoff
    if (conditions.lastVisitBefore !== false) {
      where.lastVisitAt = { lt: cutoffDate };
    }

    // Chronic condition matching
    if (conditions.chronicCondition) {
      where.chronicConditions = { has: conditions.chronicCondition };
    }

    // Get patients not already contacted by this rule in the wait period
    const recentlyContacted = await this.prisma.automationLog.findMany({
      where: {
        ruleId,
        tenantId,
        executedAt: { gte: cutoffDate },
        result: { in: ['sent', 'booked'] },
      },
      select: { patientId: true },
    });

    const excludeIds = new Set(recentlyContacted.map(l => l.patientId));

    const patients = await this.prisma.patient.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    return patients.filter(p => !excludeIds.has(p.id));
  }

  /**
   * Execute a single action from a rule
   */
  private async executeAction(tenantId: string, patient: any, action: any, rule: any) {
    switch (action.type) {
      case 'SEND_WHATSAPP': {
        const message = (action.message || '')
          .replace('{{name}}', patient.firstName)
          .replace('{{firstName}}', patient.firstName)
          .replace('{{lastName}}', patient.lastName || '');

        await this.whatsappService.sendTextMessage(tenantId, patient.phone, message);
        break;
      }
      case 'ADD_TAG': {
        const current = await this.prisma.patient.findUnique({ where: { id: patient.id } });
        if (current) {
          const tags = [...new Set([...current.tags, action.tag])];
          await this.prisma.patient.update({ where: { id: patient.id }, data: { tags } });
        }
        break;
      }
      case 'UPDATE_CRM_STAGE': {
        await this.prisma.lead.updateMany({
          where: { tenantId, patientId: patient.id },
          data: { stage: action.stage },
        });
        break;
      }
      case 'NOTIFY_STAFF': {
        this.logger.log(`Staff notification: Rule "${rule.name}" triggered for patient ${patient.firstName} ${patient.lastName}`);
        break;
      }
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  // ==========================================
  // PRE-BUILT PROTOCOL TEMPLATES
  // ==========================================

  async getProtocolTemplates() {
    return [
      {
        id: 'diabetes-management',
        name: 'Diabetes Management Protocol',
        description: 'HbA1c test every 90 days, eye exam annually, foot exam every 6 months',
        rules: [
          { trigger: 'DIAGNOSIS_RECORDED', conditions: { diagnosisCodes: ['E11'] }, waitDays: 90, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, it is time for your HbA1c test. Regular monitoring helps manage diabetes effectively. Reply BOOK to schedule.' }] },
          { trigger: 'DIAGNOSIS_RECORDED', conditions: { diagnosisCodes: ['E11'] }, waitDays: 180, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your 6-monthly diabetic foot examination is due. Reply BOOK to schedule with our specialist.' }] },
          { trigger: 'DIAGNOSIS_RECORDED', conditions: { diagnosisCodes: ['E11'] }, waitDays: 365, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your annual eye screening for diabetic retinopathy is due. Early detection prevents vision loss. Reply BOOK to schedule.' }] },
        ],
      },
      {
        id: 'hypertension-monitoring',
        name: 'Hypertension Monitoring',
        description: 'BP check every 30 days, medication refill reminders',
        rules: [
          { trigger: 'MEDICATION_PRESCRIBED', conditions: { tags: ['hypertension'] }, waitDays: 25, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your BP medication refill is due in 5 days. Reply REFILL to order or BOOK to schedule a checkup.' }] },
          { trigger: 'VISIT_COMPLETED', conditions: { tags: ['hypertension'] }, waitDays: 30, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, time for your monthly BP checkup. Regular monitoring keeps your heart healthy. Reply BOOK to schedule.' }] },
        ],
      },
      {
        id: 'post-surgery-followup',
        name: 'Post-Surgery Follow-Up',
        description: 'Wound check at 7 days, suture removal at 14 days, clearance at 30 days',
        rules: [
          { trigger: 'VISIT_COMPLETED', conditions: { tags: ['post-surgery'] }, waitDays: 7, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, it has been 7 days since your procedure. Time for your wound check. Reply BOOK to schedule.' }] },
          { trigger: 'VISIT_COMPLETED', conditions: { tags: ['post-surgery'] }, waitDays: 14, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your suture removal appointment is due. Reply BOOK to schedule.' }] },
          { trigger: 'VISIT_COMPLETED', conditions: { tags: ['post-surgery'] }, waitDays: 30, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your 30-day post-surgery clearance check is due. Reply BOOK to schedule.' }] },
        ],
      },
      {
        id: 'pregnancy-care',
        name: 'Pregnancy Care Protocol',
        description: 'Monthly checkups with trimester-specific tests',
        rules: [
          { trigger: 'DIAGNOSIS_RECORDED', conditions: { tags: ['pregnancy'] }, waitDays: 30, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your monthly prenatal checkup is due. Regular monitoring ensures a healthy pregnancy. Reply BOOK to schedule.' }] },
        ],
      },
      {
        id: 'dental-hygiene',
        name: 'Dental Hygiene Schedule',
        description: 'Cleaning every 6 months',
        rules: [
          { trigger: 'VISIT_COMPLETED', conditions: { tags: ['dental'] }, waitDays: 180, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, it has been 6 months since your last dental cleaning. Regular cleanings prevent cavities and gum disease. Reply BOOK to schedule.' }] },
        ],
      },
      {
        id: 'annual-health-checkup',
        name: 'Annual Health Checkup Reminder',
        description: 'Yearly comprehensive health screening',
        rules: [
          { trigger: 'TIME_ELAPSED', conditions: {}, waitDays: 365, actions: [{ type: 'SEND_WHATSAPP', message: 'Hi {{name}}, your annual health checkup is due. Prevention is better than cure. Check our health packages. Reply BOOK to schedule.' }] },
        ],
      },
    ];
  }

  /**
   * Install a pre-built protocol template for a tenant
   */
  async installProtocol(tenantId: string, protocolId: string) {
    const templates = await this.getProtocolTemplates();
    const protocol = templates.find(t => t.id === protocolId);
    if (!protocol) throw new NotFoundException('Protocol template not found');

    const createdRules = [];
    for (const rule of protocol.rules) {
      const created = await this.prisma.automationRule.create({
        data: {
          tenantId,
          name: `${protocol.name} - ${rule.waitDays} days`,
          description: protocol.description,
          trigger: rule.trigger as any,
          conditions: rule.conditions,
          waitDays: rule.waitDays,
          actions: rule.actions,
          escalation: { retryAfterDays: 7, maxRetries: 2 },
          isActive: true,
        },
      });
      createdRules.push(created);
    }

    return { protocol: protocol.name, rulesCreated: createdRules.length, rules: createdRules };
  }

  // ==========================================
  // STATS
  // ==========================================

  async getStats(tenantId: string) {
    const [activeRules, totalTriggered, totalConverted, recentLogs] = await Promise.all([
      this.prisma.automationRule.count({ where: { tenantId, isActive: true } }),
      this.prisma.automationRule.aggregate({
        where: { tenantId },
        _sum: { triggeredCount: true },
      }),
      this.prisma.automationRule.aggregate({
        where: { tenantId },
        _sum: { convertedCount: true },
      }),
      this.prisma.automationLog.findMany({
        where: { tenantId },
        orderBy: { executedAt: 'desc' },
        take: 10,
        include: {
          rule: { select: { name: true } },
        },
      }),
    ]);

    const triggered = totalTriggered._sum.triggeredCount || 0;
    const converted = totalConverted._sum.convertedCount || 0;

    return {
      activeRules,
      totalTriggered: triggered,
      totalConverted: converted,
      conversionRate: triggered > 0 ? Math.round((converted / triggered) * 100) : 0,
      recentActivity: recentLogs,
    };
  }

// ==========================================
  // LOGS
  // ==========================================

  async getLogs(tenantId: string, limit = 50) {
    const logs = await this.prisma.automationLog.findMany({
      where: { tenantId },
      orderBy: { executedAt: 'desc' },
      take: limit,
      include: { rule: { select: { name: true } } },
    });
    return { data: logs };
  }

  async deleteRule(tenantId: string, id: string) {
    await this.prisma.automationJob.updateMany({
      where: { tenantId, ruleId: id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    await this.prisma.automationRule.delete({ where: { id } });
    return { deleted: true };
  }
}