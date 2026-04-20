import {
  Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ComplianceService } from '../compliance/compliance.service';
import {
  CreateOrderDto, UpdateOrderStatusDto, ListOrdersDto, CollectSampleDto,
  DispatchSampleDto, ReceiveSampleDto, RejectSampleDto,
  SubmitResultsDto, ValidateResultDto, SignReportDto, AmendReportDto,
  CreateHomeCollectionDto, AssignAgentDto, AgentCheckinDto, CollectionCheckoutDto,
  CreateTestDto, CreatePackageDto, CreateDoctorCRMDto, CreateCorporateClientDto,
  CreateQcResultDto, CreateReagentDto, AdjustStockDto,
  CreateAutomationRuleDto,
} from './dto/diagnostic.dto';

// ── 8-Stage Status Transitions ───────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDERED:          ['SAMPLE_COLLECTED', 'CANCELLED'],
  SAMPLE_COLLECTED: ['DISPATCHED', 'RECEIVED_AT_LAB', 'CANCELLED', 'REJECTED'],
  DISPATCHED:       ['RECEIVED_AT_LAB', 'REJECTED'],
  RECEIVED_AT_LAB:  ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS:      ['RESULTED', 'CANCELLED'],
  RESULTED:         ['VALIDATED', 'IN_PROGRESS'],
  VALIDATED:        ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
  REJECTED:         ['SAMPLE_COLLECTED'],
};

// ── Reference Ranges ─────────────────────────────────────────────────────────

const DEFAULT_REFERENCE_RANGES: Record<string, any[]> = {
  'CBC':    [{ gender: 'MALE', lowerNormal: 13.5, upperNormal: 17.5, unit: 'g/dL', lowerCritical: 7.0, upperCritical: 20.0 }],
  'HBA1C':  [{ gender: 'ALL', lowerNormal: 4.0, upperNormal: 5.7, unit: '%', lowerCritical: 2.0, upperCritical: 15.0 }],
  'FBS':    [{ gender: 'ALL', lowerNormal: 70, upperNormal: 100, unit: 'mg/dL', lowerCritical: 40, upperCritical: 500 }],
  'PPBS':   [{ gender: 'ALL', lowerNormal: 70, upperNormal: 140, unit: 'mg/dL', lowerCritical: 40, upperCritical: 600 }],
  'CREAT':  [{ gender: 'MALE', lowerNormal: 0.7, upperNormal: 1.3, unit: 'mg/dL', lowerCritical: 0.3, upperCritical: 15.0 }],
  'TSH':    [{ gender: 'ALL', lowerNormal: 0.4, upperNormal: 4.0, unit: 'mIU/L', lowerCritical: 0.1, upperCritical: 50.0 }],
  'POTASSIUM': [{ gender: 'ALL', lowerNormal: 3.5, upperNormal: 5.1, unit: 'mEq/L', lowerCritical: 2.5, upperCritical: 6.5 }],
  'SODIUM': [{ gender: 'ALL', lowerNormal: 136, upperNormal: 145, unit: 'mEq/L', lowerCritical: 120, upperCritical: 160 }],
};

// ── Westgard Rules ────────────────────────────────────────────────────────────

function evaluateWestgard(values: number[], mean: number, sd: number): string[] {
  const flags: string[] = [];
  if (!values.length || !sd) return flags;
  const last = values[values.length - 1];
  const z = (last - mean) / sd;
  if (Math.abs(z) > 2) flags.push('1-2s warning');
  if (Math.abs(z) > 3) flags.push('1-3s reject');
  if (values.length >= 2) {
    const z2 = (values[values.length - 2] - mean) / sd;
    if ((z > 2 && z2 > 2) || (z < -2 && z2 < -2)) flags.push('2-2s reject');
    if (Math.abs(z - z2) > 4) flags.push('R-4s reject');
  }
  if (values.length >= 4) {
    const last4 = values.slice(-4).map(v => (v - mean) / sd);
    if (last4.every(z => z > 1) || last4.every(z => z < -1)) flags.push('4-1s reject');
  }
  if (values.length >= 10) {
    const last10 = values.slice(-10).map(v => (v - mean) / sd);
    if (last10.every(z => z > 0) || last10.every(z => z < 0)) flags.push('10x reject');
  }
  return flags;
}

@Injectable()
export class DiagnosticService {
  private readonly logger = new Logger(DiagnosticService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private compliance: ComplianceService,
  ) {}

  // ════════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════

  async getDashboard(tenantId: string, branchId?: string) {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today.getTime() + 86_400_000 - 1);
      const where: any = { tenantId };
      if (branchId) where.branchId = branchId;

      const [
        todayOrders, pending, inProgress, resulted, validated, delivered,
        stat, todayRevenue, criticalUnacked, tatBreached,
      ] = await Promise.all([
        this.prisma.labOrder.count({ where: { ...where, createdAt: { gte: today, lte: todayEnd } } }),
        this.prisma.labOrder.count({ where: { ...where, status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'DISPATCHED', 'RECEIVED_AT_LAB'] } } }),
        this.prisma.labOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        this.prisma.labOrder.count({ where: { ...where, status: 'RESULTED' } }),
        this.prisma.labOrder.count({ where: { ...where, status: 'VALIDATED' } }),
        this.prisma.labOrder.count({ where: { ...where, status: 'DELIVERED', updatedAt: { gte: today } } }),
        this.prisma.labOrder.count({ where: { ...where, isStat: true, status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] } } }),
        this.prisma.invoice.aggregate({ where: { tenantId, createdAt: { gte: today } }, _sum: { totalAmount: true } }),
        this.prisma.criticalValueAlert.count({ where: { tenantId, acknowledgedAt: null, createdAt: { gte: today } } }),
        // TAT breached: orders past their expected delivery time
        this.prisma.labOrder.count({
          where: { ...where, status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] }, createdAt: { lt: new Date(Date.now() - 86_400_000) } },
        }),
      ]);

      const trend = await this.getOrderTrend(tenantId, 14);

      // Get wallet credits for low-balance warning
      const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } }).catch(() => null);

      return {
        todayOrders, pending, inProgress, resulted, validated, delivered,
        stat, criticalUnacked, tatBreached,
        todayRevenue: todayRevenue._sum.totalAmount ?? 0,
        trend,
        walletCredits: wallet?.waCredits ?? 0,
        smsCredits: wallet?.smsCredits ?? 0,
      };
    } catch (err) {
      this.logger.error('getDashboard error', err?.message);
      return { todayOrders: 0, pending: 0, inProgress: 0, resulted: 0, validated: 0, delivered: 0, stat: 0, criticalUnacked: 0, tatBreached: 0, todayRevenue: 0, trend: [] };
    }
  }

  async getOrderTrend(tenantId: string, days = 14) {
    const from = new Date(); from.setDate(from.getDate() - days);
    const orders = await this.prisma.labOrder.findMany({
      where: { tenantId, createdAt: { gte: from } },
      select: { createdAt: true, status: true, totalAmount: true },
    });
    const byDate: Record<string, any> = {};
    for (let i = days; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      byDate[key] = { date: key, orders: 0, delivered: 0, revenue: 0 };
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (byDate[key]) {
        byDate[key].orders++;
        if (o.status === 'DELIVERED') { byDate[key].delivered++; byDate[key].revenue += o.totalAmount ?? 0; }
      }
    }
    return Object.values(byDate);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LAB ORDERS — CORE LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════════

  async createOrder(tenantId: string, branchId: string, dto: CreateOrderDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const orderNumber = await this.generateOrderNumber(tenantId);
    const barcode = this.generateBarcode(orderNumber);

    const totalAmount = dto.tests.reduce((sum, t) => sum + (t.price ?? 0), 0);
    const statPremium = dto.isStat ? 20000 : 0; // ₹200 STAT premium

    const order = await this.prisma.$transaction(async tx => {
      const o = await tx.labOrder.create({
        data: {
          tenantId, branchId: dto.branchId ?? branchId,
          patientId: dto.patientId,
          orderNumber, sampleBarcode: barcode,
          tests: dto.tests as any,
          status: 'ORDERED',
          collectionMode: dto.collectionMode ?? 'WALKIN',
          referringDoctor: dto.referringDoctor,
          referringDoctorCrmId: dto.referringDoctorCrmId,
          corporateClientId: dto.corporateClientId,
          clinicalInfo: dto.clinicalInfo,
          notes: dto.notes,
          isStat: dto.isStat ?? false,
          priority: dto.priority ?? (dto.isStat ? 'stat' : 'normal'),
          totalAmount: totalAmount + statPremium,
          statPremium,
        } as any,
        include: { patient: { select: { firstName: true, lastName: true, phone: true, gender: true, dateOfBirth: true } } },
      });

      // Create normalized OrderItems
      for (const test of dto.tests) {
        await tx.orderItem.create({
          data: {
            tenantId, labOrderId: o.id,
            testId: test.testId,
            testCode: test.testCode,
            testName: test.testName,
            department: test.department,
            price: test.price ?? 0,
            isStat: test.isStat ?? dto.isStat ?? false,
            isOutsourced: test.isOutsourced ?? false,
            outsourcedTo: test.outsourcedTo,
            // TAT deadline
            tatDeadline: await this.calculateTatDeadline(tenantId, test.testCode, dto.isStat ?? false),
          },
        });
      }

      // Create primary sample record
      await tx.sample.create({
        data: {
          tenantId, labOrderId: o.id,
          barcode,
          status: 'REGISTERED',
          coldChainRequired: dto.tests.some((t: any) => ['BLOOD_CULTURE', 'BC'].includes(t.testCode)),
        } as any,
      });

      return o;
    });

    // Update referring doctor MTD volume
    if (dto.referringDoctorCrmId) {
      this.prisma.doctorCRM.update({
        where: { id: dto.referringDoctorCrmId },
        data: { referralVolumeMtd: { increment: 1 }, lastContactDate: new Date() },
      }).catch(() => {});
    }

    // Send T01 — Registration Confirmed
    const patName = `${order.patient.firstName} ${order.patient.lastName ?? ''}`.trim();
    await this.whatsapp.sendTextMessage(
      tenantId, patient.phone,
      `🧪 *Test Order Confirmed!*\n\nHi ${patName},\n\nYour lab test order has been registered.\n\n` +
      `📋 Order ID: *${orderNumber}*\n🔖 Barcode: ${barcode}\n` +
      `🧫 Tests: ${dto.tests.map(t => t.testName).join(', ')}\n` +
      (dto.isStat ? `⚡ *STAT/URGENT order* — Priority processing\n` : '') +
      `\nPlease collect your collection slip from the counter.\n\n_We'll notify you at every step. Questions? Just reply here._`
    ).catch(() => {});

    // Log message usage
    await this.logMessageUsage(tenantId, patient.phone, 'UTILITY', 'T01', order.id, 1.0);

    return { ...order, barcode };
  }

  async listOrders(tenantId: string, filters: ListOrdersDto) {
    try {
      const { page = 1, limit = 20, status, department, search, date, priority, branchId, statOnly } = filters;
      const skip = (page - 1) * limit;
      const where: any = { tenantId };

      if (status) {
        // Support comma-separated statuses
        const statuses = status.split(',').map(s => s.trim());
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
      if (priority) where.priority = priority;
      if (branchId) where.branchId = branchId;
      if (statOnly) where.isStat = true;
      if (date) {
        const d = new Date(date);
        where.createdAt = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
      }
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { patient: { firstName: { contains: search, mode: 'insensitive' } } },
          { patient: { lastName: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search } } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.labOrder.findMany({
          where, skip, take: +limit,
          orderBy: [
            { isStat: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            patient: { select: { firstName: true, lastName: true, phone: true, healthId: true, gender: true, dateOfBirth: true } },
            orderItems: { select: { id: true, testCode: true, testName: true, department: true, status: true, isStat: true, tatDeadline: true, price: true } },
            samples: { select: { barcode: true, status: true, tubeType: true } },
          },
        }),
        this.prisma.labOrder.count({ where }),
      ]);

      // Enrich with TAT status
      const enriched = data.map(o => ({
        ...o,
        tatStatus: this.getTatStatus(o as any),
        pendingValidation: (o.orderItems as any[]).filter(i => i.status === 'RESULTED').length,
      }));

      return { data: enriched, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (err) {
      this.logger.error('listOrders error', err?.message);
      return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }

  async getOrder(tenantId: string, id: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, healthId: true, gender: true, dateOfBirth: true, address: true } },
        orderItems: {
          include: {
            resultEntries: {
              where: { isDraft: false },
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
        samples: { include: { statusLogs: { orderBy: { createdAt: 'asc' }, take: 20 } } },
        diagnosticReports: { orderBy: { version: 'desc' } },
        criticalAlerts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return { ...order, tatStatus: this.getTatStatus(order as any) };
  }

  async updateOrderStatus(tenantId: string, id: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: { patient: { select: { firstName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} → ${dto.status}. Allowed: ${allowed.join(', ')}`);
    }

    const updateData: any = { status: dto.status };
    const now = new Date();

    if (dto.status === 'SAMPLE_COLLECTED') updateData.sampleCollectedAt = now;
    if (dto.status === 'DISPATCHED') updateData.dispatchedAt = now;
    if (dto.status === 'RECEIVED_AT_LAB') updateData.receivedAtLabAt = now;

    // Also update OrderItems status to match
    const itemStatus = this.orderStatusToItemStatus(dto.status);
    if (itemStatus) {
      await this.prisma.orderItem.updateMany({
        where: { labOrderId: id, status: { notIn: ['RELEASED', 'REJECTED'] } },
        data: { status: itemStatus as any },
      });
    }

    // Update sample status
    const sampleStatus = this.orderStatusToSampleStatus(dto.status);
    if (sampleStatus) {
      const samples = await this.prisma.sample.findMany({ where: { labOrderId: id } });
      for (const s of samples) {
        if (s.status !== 'RELEASED' && s.status !== 'REJECTED') {
          await this.prisma.sample.update({ where: { id: s.id }, data: { status: sampleStatus as any } });
          await this.prisma.sampleStatusLog.create({
            data: { sampleId: s.id, fromStatus: s.status, toStatus: sampleStatus, userId, notes: dto.notes },
          });
        }
      }
    }

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: updateData,
      include: { patient: { select: { firstName: true, phone: true } } },
    });

    // WhatsApp notifications per status
    await this.sendStatusWhatsApp(tenantId, updated, dto.status, dto.rejectionReason);

    return updated;
  }

  // ── Sample Collection ─────────────────────────────────────────────────────

  async collectSample(tenantId: string, orderId: string, userId: string, dto: CollectSampleDto) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { patient: { select: { phone: true } }, samples: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!['ORDERED'].includes(order.status)) {
      throw new BadRequestException('Order must be in ORDERED status to collect sample');
    }

    const barcode = dto.barcode ?? order.sampleBarcode ?? this.generateBarcode(order.orderNumber);

    // Update or create primary sample
    const existingSample = (order.samples as any[])[0];
    if (existingSample) {
      await this.prisma.sample.update({
        where: { id: existingSample.id },
        data: {
          barcode, tubeType: dto.tubeType, containerType: dto.containerType,
          collectedAt: new Date(), collectedBy: userId,
          status: 'COLLECTED',
          coldChainRequired: dto.coldChainRequired ?? existingSample.coldChainRequired,
          photoUrl: dto.photoUrl,
        },
      });
      await this.prisma.sampleStatusLog.create({
        data: { sampleId: existingSample.id, fromStatus: existingSample.status, toStatus: 'COLLECTED', userId, notes: dto.notes },
      });
    }

    // Advance order status
    await this.prisma.labOrder.update({
      where: { id: orderId },
      data: { status: 'SAMPLE_COLLECTED', sampleCollectedAt: new Date(), sampleBarcode: barcode },
    });

    // T02 — Sample Collected
    await this.whatsapp.sendTextMessage(
      tenantId, order.patient.phone,
      `✅ *Sample Collected*\n\nYour sample for order *${order.orderNumber}* has been collected successfully.\n\n` +
      `🔖 Barcode: ${barcode}\n⏱️ Expected report: ${await this.getExpectedTat(tenantId, orderId)}\n\n_We'll notify you when your report is ready._`
    ).catch(() => {});
    await this.logMessageUsage(tenantId, order.patient.phone, 'UTILITY', 'T02', orderId, 1.0);

    return { success: true, barcode, orderId };
  }

  async dispatchSamples(tenantId: string, userId: string, dto: DispatchSampleDto) {
    const dispatched: string[] = [];
    for (const barcode of dto.barcodes) {
      const sample = await this.prisma.sample.findUnique({ where: { barcode } });
      if (!sample || sample.tenantId !== tenantId) continue;
      await this.prisma.sample.update({
        where: { barcode },
        data: { status: 'DISPATCHED' },
      });
      await this.prisma.sampleStatusLog.create({
        data: { sampleId: sample.id, fromStatus: sample.status, toStatus: 'DISPATCHED', userId },
      });
      await this.prisma.labOrder.updateMany({
        where: { id: sample.labOrderId, status: 'SAMPLE_COLLECTED' },
        data: { status: 'DISPATCHED', dispatchedAt: new Date() },
      });
      dispatched.push(barcode);
    }
    return { dispatched: dispatched.length, barcodes: dispatched };
  }

  async receiveSamples(tenantId: string, userId: string, dto: ReceiveSampleDto) {
    const received: string[] = [];
    const rejected: string[] = [];
    for (const barcode of dto.barcodes) {
      const sample = await this.prisma.sample.findUnique({ where: { barcode } });
      if (!sample || sample.tenantId !== tenantId) continue;
      await this.prisma.sample.update({
        where: { barcode },
        data: { status: 'RECEIVED' },
      });
      await this.prisma.sampleStatusLog.create({
        data: { sampleId: sample.id, fromStatus: sample.status, toStatus: 'RECEIVED', userId },
      });
      await this.prisma.labOrder.updateMany({
        where: { id: sample.labOrderId, status: { in: ['DISPATCHED', 'SAMPLE_COLLECTED'] } },
        data: { status: 'RECEIVED_AT_LAB', receivedAtLabAt: new Date() },
      });
      received.push(barcode);
    }
    return { received: received.length, rejected: rejected.length, receivedBarcodes: received };
  }

  async rejectSample(tenantId: string, userId: string, dto: RejectSampleDto) {
    const sample = await this.prisma.sample.findUnique({ where: { barcode: dto.barcode } });
    if (!sample || sample.tenantId !== tenantId) throw new NotFoundException('Sample not found');

    await this.prisma.sample.update({
      where: { barcode: dto.barcode },
      data: { status: 'REJECTED', rejectionReason: dto.rejectionReason },
    });
    await this.prisma.sampleStatusLog.create({
      data: { sampleId: sample.id, fromStatus: sample.status, toStatus: 'REJECTED', userId, notes: dto.rejectionReason },
    });
    await this.prisma.labOrder.update({
      where: { id: sample.labOrderId },
      data: { status: 'REJECTED' },
    });

    // Notify patient of rejection with recollection link
    const order = await this.prisma.labOrder.findUnique({
      where: { id: sample.labOrderId },
      include: { patient: { select: { firstName: true, phone: true } } },
    });
    if (order?.patient.phone) {
      await this.whatsapp.sendTextMessage(
        tenantId, order.patient.phone,
        `⚠️ *Sample Re-collection Required*\n\nHi ${order.patient.firstName},\n\n` +
        `Your sample for order *${order.orderNumber}* could not be processed.\n\n` +
        `❌ Reason: ${dto.rejectionReason}\n\n` +
        `Please visit us for re-collection at your earliest convenience. ` +
        `There will be no additional charge for re-collection.\n\n_Reply "REBOOK" to schedule home collection._`
      ).catch(() => {});
      await this.logMessageUsage(tenantId, order.patient.phone, 'UTILITY', 'T04', sample.labOrderId, 1.0);
    }

    return { rejected: true, barcode: dto.barcode, reason: dto.rejectionReason };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESULT ENTRY
  // ════════════════════════════════════════════════════════════════════════════

  async getWorklist(tenantId: string, filters: { department?: string; branchId?: string; userId?: string }) {
    const where: any = {
      tenantId,
      status: { in: ['IN_PROGRESS', 'RESULTED', 'RECEIVED_AT_LAB'] },
    };
    if (filters.branchId) where.branchId = filters.branchId;

    const orders = await this.prisma.labOrder.findMany({
      where,
      orderBy: [{ isStat: 'desc' }, { createdAt: 'asc' }],
      include: {
        patient: { select: { firstName: true, lastName: true, dateOfBirth: true, gender: true } },
        orderItems: {
          where: filters.department ? { department: filters.department } : undefined,
          include: {
            resultEntries: { where: { isDraft: false }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
      take: 50,
    });

    return orders.map(o => ({
      ...o,
      tatStatus: this.getTatStatus(o as any),
      pendingItems: (o.orderItems as any[]).filter(i =>
        !['RESULTED', 'VALIDATED', 'DELIVERED'].includes(i.status)
      ).length,
    }));
  }

  async submitResults(tenantId: string, orderId: string, userId: string, dto: SubmitResultsDto) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { patient: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!['RECEIVED_AT_LAB', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('Order must be at lab to enter results');
    }

    const criticalAlerts: any[] = [];

    for (const rv of dto.results) {
      const item = await this.prisma.orderItem.findFirst({
        where: { id: rv.orderItemId, labOrderId: orderId },
      });
      if (!item) continue;

      // Get reference ranges
      const ranges = await this.getRefRange(tenantId, item.testCode, order.patient as any);
      const flag = this.calculateFlag(rv.numericValue, ranges);

      // Check for critical value
      const isCritical = ['CRITICAL_LOW', 'CRITICAL_HIGH'].includes(flag);

      const entry = await this.prisma.resultEntry.upsert({
        where: {
          // Use findFirst then create/update pattern
          id: await this.getLatestResultId(orderId, rv.orderItemId) || 'new',
        },
        create: {
          tenantId, orderItemId: rv.orderItemId, labOrderId: orderId,
          numericValue: rv.numericValue, textValue: rv.textValue,
          unit: rv.unit ?? ranges?.unit,
          flag: flag as any,
          lowerNormal: ranges?.lowerNormal, upperNormal: ranges?.upperNormal,
          lowerCritical: ranges?.lowerCritical, upperCritical: ranges?.upperCritical,
          interpretation: rv.interpretation,
          isDraft: rv.isDraft ?? dto.isDraft ?? false,
          enteredBy: userId, enteredAt: new Date(),
        },
        update: {
          numericValue: rv.numericValue, textValue: rv.textValue,
          unit: rv.unit ?? ranges?.unit,
          flag: flag as any,
          interpretation: rv.interpretation,
          isDraft: rv.isDraft ?? dto.isDraft ?? false,
          enteredBy: userId, enteredAt: new Date(),
          version: { increment: 1 },
        },
      }).catch(async () => {
        // If upsert fails due to 'new' id, just create
        return this.prisma.resultEntry.create({
          data: {
            tenantId, orderItemId: rv.orderItemId, labOrderId: orderId,
            numericValue: rv.numericValue, textValue: rv.textValue,
            unit: rv.unit ?? ranges?.unit,
            flag: flag as any,
            lowerNormal: ranges?.lowerNormal, upperNormal: ranges?.upperNormal,
            lowerCritical: ranges?.lowerCritical, upperCritical: ranges?.upperCritical,
            interpretation: rv.interpretation,
            isDraft: rv.isDraft ?? dto.isDraft ?? false,
            enteredBy: userId, enteredAt: new Date(),
          },
        });
      });

      // Update OrderItem status
      if (!rv.isDraft && !dto.isDraft) {
        await this.prisma.orderItem.update({
          where: { id: rv.orderItemId },
          data: { status: 'RESULTED' as any },
        });
      }

      // Fire critical value alert
      if (isCritical && !dto.isDraft) {
        criticalAlerts.push({
          resultEntryId: entry.id, labOrderId: orderId,
          patientId: order.patientId,
          testCode: item.testCode, testName: item.testName,
          criticalValue: rv.numericValue?.toString() ?? rv.textValue ?? '',
          threshold: isCritical ? 'CRITICAL' : 'NORMAL',
        });
      }
    }

    // Fire critical value alerts
    for (const alert of criticalAlerts) {
      await this.fireCriticalValueAlert(tenantId, alert, order);
    }

    // Check if all non-draft items are resulted → advance order status
    const allItems = await this.prisma.orderItem.findMany({
      where: { labOrderId: orderId, isOutsourced: false },
    });
    const allResulted = allItems.every(i =>
      ['RESULTED', 'VALIDATED', 'DELIVERED', 'CANCELLED'].includes(i.status)
    );

    if (allResulted && !dto.isDraft) {
      await this.prisma.labOrder.update({
        where: { id: orderId },
        data: { status: 'RESULTED', reportedAt: new Date() },
      });
    } else if (order.status === 'RECEIVED_AT_LAB') {
      await this.prisma.labOrder.update({
        where: { id: orderId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return { saved: dto.results.length, criticalAlerts: criticalAlerts.length };
  }

  async validateResult(tenantId: string, orderId: string, userId: string, dto: ValidateResultDto) {
    const entry = await this.prisma.resultEntry.findFirst({
      where: { id: dto.resultEntryId, labOrderId: orderId },
    });
    if (!entry) throw new NotFoundException('Result entry not found');

    await this.prisma.resultEntry.update({
      where: { id: dto.resultEntryId },
      data: { validatedBy: userId, validatedAt: new Date(), interpretation: dto.interpretation ?? entry.interpretation },
    });
    await this.prisma.orderItem.update({
      where: { id: entry.orderItemId },
      data: { status: 'VALIDATED' as any },
    });

    // Check if all items validated → advance to VALIDATED
    const allItems = await this.prisma.orderItem.findMany({ where: { labOrderId: orderId, isOutsourced: false } });
    const allValidated = allItems.every(i => ['VALIDATED', 'DELIVERED', 'CANCELLED'].includes(i.status));
    if (allValidated) {
      await this.prisma.labOrder.update({ where: { id: orderId }, data: { status: 'VALIDATED' } });
    }

    return { validated: true };
  }

  async signAndRelease(tenantId: string, orderId: string, userId: string, dto: SignReportDto) {
    // ── Regulatory hard-block (Sprint 3) ──────────────────────────────────
    // This throws ForbiddenException with a specific, actionable message if
    // any applicable compliance surface fails (BMW, biosafety, PC-PNDT Form F,
    // AERB dose entry, mammography operator QC). The release MUST NOT happen
    // unless every gate passes.
    await this.compliance.assertCanReleaseReport(tenantId, orderId);

    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId, status: { in: ['VALIDATED', 'RESULTED'] } },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, gender: true, dateOfBirth: true } },
        orderItems: { include: { resultEntries: { where: { isDraft: false }, orderBy: { version: 'desc' }, take: 1 } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found or not ready for sign-off');

    // Sign all result entries
    await this.prisma.resultEntry.updateMany({
      where: { labOrderId: orderId, isDraft: false, signedBy: null },
      data: { signedBy: userId, signedAt: new Date() },
    });

    // Create diagnostic report record
    const signatureHash = `${userId}-${orderId}-${Date.now()}`;
    const report = await this.prisma.diagnosticReport.create({
      data: {
        tenantId, labOrderId: orderId,
        generatedAt: new Date(), releasedAt: new Date(),
        signedBy: userId, signatureHash,
        reportType: 'lab',
        version: 1,
      },
    });

    // Mark all items as VALIDATED/DELIVERED
    await this.prisma.orderItem.updateMany({
      where: { labOrderId: orderId },
      data: { status: 'DELIVERED' as any },
    });

    // Advance order to DELIVERED
    await this.prisma.labOrder.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', releasedAt: new Date(), reportDelivered: true, waSent: true },
    });

    // Save to Patient Vault
    await this.saveToVault(tenantId, order as any, report.id).catch(() => {});

    // Send T05/T06 — Report Ready
    const hasAbnormal = (order.orderItems as any[]).some(i =>
      i.resultEntries?.[0]?.flag && !['NORMAL', 'TEXT'].includes(i.resultEntries[0].flag)
    );
    const patName = `${order.patient.firstName} ${order.patient.lastName ?? ''}`.trim();

    await this.whatsapp.sendTextMessage(
      tenantId, order.patient.phone,
      `📄 *Your Lab Report is Ready!*\n\nHi ${patName},\n\n` +
      (hasAbnormal ? `⚠️ Some values are outside the normal range. Please consult your doctor.\n\n` : '') +
      `Your report for order *${order.orderNumber}* is ready.\n\n` +
      `📥 View report online: ${process.env.FRONTEND_URL ?? 'https://hospibot.in'}/report/${orderId}?token=${signatureHash}\n\n` +
      `_This link is valid for 30 days. Questions? Reply here or call us._`
    ).catch(() => {});
    await this.logMessageUsage(tenantId, order.patient.phone, hasAbnormal ? 'UTILITY' : 'UTILITY', hasAbnormal ? 'T06' : 'T05', orderId, 1.0);

    // Deliver to referring doctor if any
    if (order.referringDoctorCrmId) {
      const doc = await this.prisma.doctorCRM.findUnique({ where: { id: order.referringDoctorCrmId } });
      if (doc?.mobile) {
        await this.whatsapp.sendTextMessage(
          tenantId, doc.mobile,
          `📄 *Lab Report Ready — Patient: ${patName}*\n\nOrder: ${order.orderNumber}\n` +
          (hasAbnormal ? `⚠️ Abnormal values noted — please review\n\n` : '') +
          `View: ${process.env.FRONTEND_URL ?? 'https://hospibot.in'}/report/${orderId}?token=${signatureHash}`
        ).catch(() => {});
      }
    }

    // Schedule Revenue Engine (re-test reminders)
    setImmediate(() => this.scheduleRevenueEngine(tenantId, order as any).catch(() => {}));

    return { released: true, reportId: report.id, hasAbnormal };
  }

  async amendReport(tenantId: string, orderId: string, userId: string, dto: AmendReportDto) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, tenantId, status: 'DELIVERED' },
      include: { patient: { select: { firstName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Delivered order not found');

    // Get current report version
    const latestReport = await this.prisma.diagnosticReport.findFirst({
      where: { labOrderId: orderId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestReport?.version ?? 0) + 1;

    // Create new result entries with amended values
    for (const rv of dto.results) {
      const existingEntry = await this.prisma.resultEntry.findFirst({
        where: { orderItemId: rv.orderItemId, labOrderId: orderId, isDraft: false },
        orderBy: { version: 'desc' },
      });
      if (!existingEntry) continue;

      await this.prisma.resultEntry.create({
        data: {
          tenantId, orderItemId: rv.orderItemId, labOrderId: orderId,
          numericValue: rv.numericValue ?? existingEntry.numericValue,
          textValue: rv.textValue ?? existingEntry.textValue,
          unit: rv.unit ?? existingEntry.unit,
          flag: existingEntry.flag,
          lowerNormal: existingEntry.lowerNormal, upperNormal: existingEntry.upperNormal,
          interpretation: rv.interpretation ?? existingEntry.interpretation,
          isDraft: false,
          enteredBy: userId, enteredAt: new Date(),
          signedBy: userId, signedAt: new Date(),
          version: newVersion, amendReason: dto.reason,
        },
      });
    }

    // New report record
    const report = await this.prisma.diagnosticReport.create({
      data: {
        tenantId, labOrderId: orderId,
        generatedAt: new Date(), releasedAt: new Date(),
        signedBy: userId, signatureHash: `${userId}-${orderId}-${Date.now()}`,
        reportType: 'lab', version: newVersion,
        isAmended: true, amendReason: dto.reason,
        supersedesId: latestReport?.id,
      },
    });

    // Notify patient
    await this.whatsapp.sendTextMessage(
      tenantId, order.patient.phone,
      `📄 *Updated Lab Report Available*\n\nHi ${order.patient.firstName},\n\n` +
      `Your lab report for order *${order.orderNumber}* has been updated.\n` +
      `Reason: ${dto.reason}\n\nThis report supersedes the previous version.\n\n` +
      `📥 View updated report: ${process.env.FRONTEND_URL ?? 'https://hospibot.in'}/report/${orderId}?token=${report.signatureHash}`
    ).catch(() => {});

    return { amended: true, reportId: report.id, version: newVersion };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOME COLLECTION
  // ════════════════════════════════════════════════════════════════════════════

  async createHomeCollection(tenantId: string, userId: string, dto: CreateHomeCollectionDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const collection = await this.prisma.homeCollection.create({
      data: {
        tenantId, patientId: dto.patientId,
        labOrderId: dto.labOrderId,
        scheduledAt: new Date(`${dto.scheduledDate}T${dto.slotTime}`),
        address: dto.address, city: dto.city, pincode: dto.pincode,
        contactPhone: dto.contactPhone ?? patient.phone,
        notes: dto.notes, status: 'SCHEDULED',
      } as any,
    });

    // Send booking confirmation
    await this.whatsapp.sendTextMessage(
      tenantId, patient.phone,
      `🏠 *Home Sample Collection Confirmed*\n\n` +
      `📅 Date: ${new Date(`${dto.scheduledDate}`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
      `⏰ Time: ${dto.slotTime}\n📍 Address: ${dto.address}, ${dto.city} - ${dto.pincode}\n\n` +
      `Our trained phlebotomist will arrive at your location. Please:\n` +
      `• Keep a valid ID ready\n• Be fasting if required\n• Have the collection slip or this message ready\n\n` +
      `_Reply "CANCEL" to cancel this booking. Cancellations accepted up to 2 hours before the slot._`
    ).catch(() => {});
    await this.logMessageUsage(tenantId, patient.phone, 'UTILITY', 'T11', undefined, 1.0);

    return collection;
  }

  async listHomeCollections(tenantId: string, filters: any) {
    const { page = 1, limit = 20, status, date, agentId } = filters;
    const skip = (+page - 1) * +limit;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (agentId) where.technicianName = agentId;
    if (date) {
      const d = new Date(date);
      where.scheduledAt = {
        gte: new Date(d.setHours(0,0,0,0)),
        lte: new Date(d.setHours(23,59,59,999)),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.homeCollection.findMany({
        where, skip, take: +limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: { select: { firstName: true, lastName: true, phone: true, healthId: true } },
        },
      }),
      this.prisma.homeCollection.count({ where }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async assignAgent(tenantId: string, collectionId: string, dto: AssignAgentDto) {
    const coll = await this.prisma.homeCollection.findFirst({
      where: { id: collectionId, tenantId },
      include: { patient: { select: { phone: true } } },
    });
    if (!coll) throw new NotFoundException('Collection not found');

    const agent = await this.prisma.collectionAgent.findFirst({
      where: { id: dto.agentId, tenantId, isActive: true },
    });

    await this.prisma.homeCollection.update({
      where: { id: collectionId },
      data: { technicianName: agent?.userId ?? dto.agentId, status: 'ASSIGNED' } as any,
    });

    // T12 — Agent Assigned
    await this.whatsapp.sendTextMessage(
      tenantId, coll.patient.phone,
      `👤 *Agent Assigned for Home Collection*\n\nYour collection agent has been assigned for your home visit.\n\n` +
      `📅 Slot: ${(coll as any).scheduledAt?.toLocaleString('en-IN')}\n\n` +
      `_Your agent is on their way! You'll receive a notification 30 minutes before arrival._`
    ).catch(() => {});

    return { assigned: true };
  }

  async agentCheckin(tenantId: string, collectionId: string, agentUserId: string, dto: AgentCheckinDto) {
    const coll = await this.prisma.homeCollection.findFirst({
      where: { id: collectionId, tenantId },
    });
    if (!coll) throw new NotFoundException('Collection not found');

    // Update agent location
    await this.prisma.collectionAgent.updateMany({
      where: { tenantId, userId: agentUserId },
      data: { currentLat: dto.lat, currentLng: dto.lng, lastLocationAt: new Date() },
    });

    await this.prisma.homeCollection.update({
      where: { id: collectionId },
      data: { status: 'CHECKEDIN' as any } as any,
    });

    return { checkedIn: true, lat: dto.lat, lng: dto.lng };
  }

  async collectionCheckout(tenantId: string, collectionId: string, userId: string, dto: CollectionCheckoutDto) {
    const coll = await this.prisma.homeCollection.findFirst({
      where: { id: collectionId, tenantId },
      include: { patient: { select: { phone: true, firstName: true } } },
    });
    if (!coll) throw new NotFoundException('Collection not found');

    await this.prisma.homeCollection.update({
      where: { id: collectionId },
      data: { status: 'COLLECTED', collectedAt: new Date() } as any,
    });

    // Update lab order if linked
    if ((coll as any).labOrderId) {
      await this.collectSample(tenantId, (coll as any).labOrderId, userId, {
        barcode: dto.barcodes[0],
        photoUrl: dto.photoUrl,
        notes: dto.notes,
      }).catch(() => {});
    }

    return { collected: true, barcodes: dto.barcodes };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TEST CATALOG
  // ════════════════════════════════════════════════════════════════════════════

  async listCatalog(tenantId: string, search?: string, category?: string) {
    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const tests = await this.prisma.testCatalog.findMany({
      where, orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    const grouped = tests.reduce((acc: any, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push({ ...t, price: t.price / 100 });
      return acc;
    }, {});
    return { data: tests.map(t => ({ ...t, price: t.price / 100 })), grouped, total: tests.length };
  }

  async createTest(tenantId: string, dto: CreateTestDto) {
    const test = await this.prisma.testCatalog.create({
      data: {
        tenantId, code: dto.code.toUpperCase(), name: dto.name,
        category: dto.category, price: Math.round(dto.price * 100),
        turnaroundHrs: dto.turnaroundHrs ?? 24,
        sampleType: dto.sampleType ?? 'Blood',
        containerType: dto.containerType,
        methodology: dto.methodology,
        isHomeCollectionAllowed: dto.isHomeCollectionAllowed ?? true,
      },
    });

    // Seed reference ranges if provided
    if (dto.referenceRanges?.length) {
      for (const rr of dto.referenceRanges) {
        await this.prisma.referenceRange.create({
          data: { tenantId, testCode: dto.code.toUpperCase(), ...rr },
        });
      }
    }

    return test;
  }

  async updateTest(tenantId: string, id: string, dto: Partial<CreateTestDto>) {
    const test = await this.prisma.testCatalog.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException('Test not found');
    const price = dto.price !== undefined ? Math.round(dto.price * 100) : undefined;
    return this.prisma.testCatalog.update({
      where: { id },
      data: { ...dto, ...(price !== undefined ? { price } : {}), code: dto.code?.toUpperCase() },
    });
  }

  async deleteTest(tenantId: string, id: string) {
    await this.prisma.testCatalog.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  async seedDefaultCatalog(tenantId: string) {
    const DEFAULT_TESTS = [
      { code: 'CBC', name: 'Complete Blood Count', category: 'Haematology', price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'ESR', name: 'Erythrocyte Sedimentation Rate', category: 'Haematology', price: 8000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'PT', name: 'Prothrombin Time (PT/INR)', category: 'Haematology', price: 18000, sampleType: 'Blood', turnaroundHrs: 6 },
      { code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'KFT', name: 'Kidney Function Test', category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'FBS', name: 'Fasting Blood Sugar', category: 'Biochemistry', price: 8000, sampleType: 'Blood', turnaroundHrs: 2 },
      { code: 'PPBS', name: 'Post Prandial Blood Sugar', category: 'Biochemistry', price: 8000, sampleType: 'Blood', turnaroundHrs: 2 },
      { code: 'HBA1C', name: 'Glycosylated Haemoglobin (HbA1c)', category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', price: 55000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'THYROID', name: 'Thyroid Function Test (T3/T4/TSH)', category: 'Biochemistry', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'VITD', name: 'Vitamin D (25-OH)', category: 'Biochemistry', price: 85000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'VITB12', name: 'Vitamin B12', category: 'Biochemistry', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'UA', name: 'Uric Acid', category: 'Biochemistry', price: 12000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'CRP', name: 'C-Reactive Protein (CRP)', category: 'Biochemistry', price: 35000, sampleType: 'Blood', turnaroundHrs: 6 },
      { code: 'UCR', name: 'Urine Complete Routine', category: 'Urine', price: 12000, sampleType: 'Urine', turnaroundHrs: 2 },
      { code: 'BC', name: 'Blood Culture & Sensitivity', category: 'Microbiology', price: 85000, sampleType: 'Blood', turnaroundHrs: 72 },
      { code: 'UC', name: 'Urine Culture & Sensitivity', category: 'Microbiology', price: 65000, sampleType: 'Urine', turnaroundHrs: 72 },
      { code: 'WIDAL', name: 'Widal Test', category: 'Serology', price: 18000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'HBsAg', name: 'Hepatitis B Surface Antigen', category: 'Serology', price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'HIVAB', name: 'HIV Antibody Test', category: 'Serology', price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'DENGUE', name: 'Dengue NS1 Antigen', category: 'Serology', price: 55000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', category: 'Biochemistry', price: 35000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'PSA', name: 'Prostate Specific Antigen (PSA)', category: 'Tumour Markers', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'CA125', name: 'CA 125', category: 'Tumour Markers', price: 75000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'STOOL', name: 'Stool Routine & Microscopy', category: 'Stool', price: 10000, sampleType: 'Stool', turnaroundHrs: 4 },
    ];
    let seeded = 0;
    for (const test of DEFAULT_TESTS) {
      try {
        await this.prisma.testCatalog.upsert({
          where: { tenantId_code: { tenantId, code: test.code } },
          create: { tenantId, ...test, isHomeCollectionAllowed: true },
          update: {},
        });
        seeded++;
      } catch {}
    }
    return { seeded };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DOCTOR CRM
  // ════════════════════════════════════════════════════════════════════════════

  async listDoctors(tenantId: string, search?: string) {
    const where: any = { tenantId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.doctorCRM.findMany({
      where, orderBy: [{ referralVolumeMtd: 'desc' }, { name: 'asc' }],
    });
  }

  async createDoctor(tenantId: string, dto: CreateDoctorCRMDto) {
    return this.prisma.doctorCRM.create({ data: { tenantId, ...dto } });
  }

  async updateDoctor(tenantId: string, id: string, dto: Partial<CreateDoctorCRMDto>) {
    const doc = await this.prisma.doctorCRM.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Doctor not found');
    return this.prisma.doctorCRM.update({ where: { id }, data: dto });
  }

  async getDoctorStats(tenantId: string, doctorId: string) {
    const doc = await this.prisma.doctorCRM.findFirst({ where: { id: doctorId, tenantId } });
    if (!doc) throw new NotFoundException('Doctor not found');
    const [totalReferrals, thisMonthReferrals, revenue] = await Promise.all([
      this.prisma.labOrder.count({ where: { tenantId, referringDoctorCrmId: doctorId } }),
      this.prisma.labOrder.count({
        where: { tenantId, referringDoctorCrmId: doctorId, createdAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      this.prisma.labOrder.aggregate({
        where: { tenantId, referringDoctorCrmId: doctorId },
        _sum: { totalAmount: true },
      }),
    ]);
    return { doctor: doc, totalReferrals, thisMonthReferrals, totalRevenue: revenue._sum.totalAmount ?? 0 };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CORPORATE CLIENTS
  // ════════════════════════════════════════════════════════════════════════════

  async listCorporates(tenantId: string) {
    return this.prisma.corporateClient.findMany({ where: { tenantId, isActive: true } });
  }

  async createCorporate(tenantId: string, dto: CreateCorporateClientDto) {
    return this.prisma.corporateClient.create({ data: { tenantId, ...dto } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REAGENT INVENTORY
  // ════════════════════════════════════════════════════════════════════════════

  async listReagents(tenantId: string) {
    const reagents = await this.prisma.reagentInventory.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ expiryDate: 'asc' }, { name: 'asc' }],
    });
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86_400_000);
    return reagents.map(r => ({
      ...r,
      isExpired: r.expiryDate ? r.expiryDate < now : false,
      expiringInDays: r.expiryDate ? Math.ceil((r.expiryDate.getTime() - now.getTime()) / 86_400_000) : null,
      isLowStock: r.currentStock <= r.minStockLevel,
      alerts: [
        ...(r.currentStock <= r.minStockLevel ? ['LOW_STOCK'] : []),
        ...(r.expiryDate && r.expiryDate < in30Days ? ['EXPIRING_SOON'] : []),
        ...(r.expiryDate && r.expiryDate < now ? ['EXPIRED'] : []),
      ],
    }));
  }

  async createReagent(tenantId: string, dto: CreateReagentDto) {
    return this.prisma.reagentInventory.create({
      data: {
        tenantId, ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        linkedTestCodes: dto.linkedTestCodes ?? [],
      },
    });
  }

  async adjustStock(tenantId: string, reagentId: string, userId: string, dto: AdjustStockDto) {
    const reagent = await this.prisma.reagentInventory.findFirst({ where: { id: reagentId, tenantId } });
    if (!reagent) throw new NotFoundException('Reagent not found');
    const newStock = dto.txType === 'OUT' || dto.txType === 'DISCARD'
      ? reagent.currentStock - dto.quantity
      : reagent.currentStock + dto.quantity;
    if (newStock < 0) throw new BadRequestException('Insufficient stock');
    await this.prisma.reagentInventory.update({ where: { id: reagentId }, data: { currentStock: newStock } });
    await this.prisma.reagentTransaction.create({
      data: {
        tenantId, reagentId, txType: dto.txType,
        quantity: dto.quantity, balanceAfter: newStock,
        referenceType: 'manual', userId, notes: dto.notes,
      },
    });
    return { newStock };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // QC MODULE
  // ════════════════════════════════════════════════════════════════════════════

  async submitQcResult(tenantId: string, userId: string, dto: CreateQcResultDto) {
    // Get last 20 QC results for this test to evaluate Westgard
    const history = await this.prisma.qcResult.findMany({
      where: { tenantId, testCode: dto.testCode, controlLevel: dto.controlLevel },
      orderBy: { runDate: 'desc' },
      take: 20,
      select: { actualValue: true },
    });
    const values = [...history.map(h => h.actualValue).reverse(), dto.actualValue];

    // Calculate SD from history
    const mean = dto.expectedValue;
    const variance = dto.sd ? dto.sd ** 2 : (values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    const sd = dto.sd ?? Math.sqrt(variance);
    const cvPercent = sd / mean * 100;

    const westgardFlags = evaluateWestgard(values, mean, sd);
    const isPass = westgardFlags.filter(f => f.includes('reject')).length === 0;

    const result = await this.prisma.qcResult.create({
      data: {
        tenantId, testCode: dto.testCode, analyserId: dto.analyserId,
        lotNumber: dto.lotNumber, controlLevel: dto.controlLevel,
        expectedValue: dto.expectedValue, actualValue: dto.actualValue,
        mean, sd, cvPercent, westgardFlags, isPass,
        runDate: new Date(dto.runDate), technicianId: userId,
      },
    });

    return { ...result, westgardFlags, isPass };
  }

  async getQcHistory(tenantId: string, testCode: string, days = 30) {
    const from = new Date(); from.setDate(from.getDate() - days);
    const results = await this.prisma.qcResult.findMany({
      where: { tenantId, testCode, runDate: { gte: from } },
      orderBy: { runDate: 'asc' },
    });
    // Build Levey-Jennings data
    if (!results.length) return { data: [], leveyJennings: null };
    const values = results.map(r => r.actualValue);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    return {
      data: results,
      leveyJennings: { mean, sd, ucl: mean + 3 * sd, lcl: mean - 3 * sd, uwl: mean + 2 * sd, lwl: mean - 2 * sd },
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUTOMATION / REVENUE ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  async listAutomationRules(tenantId: string) {
    const rules = await this.prisma.diagnosticAutomationRule.findMany({ where: { tenantId } });
    // Enrich with stats
    const enriched = await Promise.all(rules.map(async rule => {
      const [total, converted] = await Promise.all([
        this.prisma.diagnosticAutomationExecution.count({ where: { ruleId: rule.id, status: 'SENT' } }),
        this.prisma.diagnosticAutomationExecution.count({ where: { ruleId: rule.id, status: 'CONVERTED' } }),
      ]);
      return { ...rule, sentTotal: total, convertedTotal: converted, conversionRate: total > 0 ? Math.round(converted / total * 100) : 0 };
    }));
    return enriched;
  }

  async createAutomationRule(tenantId: string, userId: string, dto: CreateAutomationRuleDto) {
    return this.prisma.diagnosticAutomationRule.create({
      data: { tenantId, ...dto, createdBy: userId, isActive: dto.isActive ?? true },
    });
  }

  async toggleRule(tenantId: string, ruleId: string) {
    const rule = await this.prisma.diagnosticAutomationRule.findFirst({ where: { id: ruleId, tenantId } });
    if (!rule) throw new NotFoundException('Rule not found');
    return this.prisma.diagnosticAutomationRule.update({
      where: { id: ruleId },
      data: { isActive: !rule.isActive },
    });
  }

  private async scheduleRevenueEngine(tenantId: string, order: any) {
    const rules = await this.prisma.diagnosticAutomationRule.findMany({
      where: { tenantId, isActive: true, triggerEvent: 'TEST_COMPLETED' },
    });

    const items = order.orderItems ?? [];
    for (const rule of rules) {
      for (const item of items) {
        if (rule.testCode && rule.testCode !== item.testCode) continue;
        // Check if already scheduled for this patient + rule
        const existing = await this.prisma.diagnosticAutomationExecution.findFirst({
          where: { ruleId: rule.id, patientId: order.patientId, status: 'PENDING' },
        });
        if (existing) continue;

        const scheduledFor = new Date(Date.now() + rule.waitDays * 86_400_000);
        await this.prisma.diagnosticAutomationExecution.create({
          data: {
            tenantId, ruleId: rule.id, patientId: order.patientId,
            patientMobile: order.patient?.phone ?? '',
            triggeredAt: new Date(), scheduledFor, status: 'PENDING',
          },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ════════════════════════════════════════════════════════════════════════════

  async getAnalytics(tenantId: string, period: '7d' | '30d' | '90d' | '365d' = '30d') {
    const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[period];
    const from = new Date(); from.setDate(from.getDate() - days);

    const [orders, delivered, homeCollections, criticalAlerts, automationStats] = await Promise.all([
      this.prisma.labOrder.findMany({
        where: { tenantId, createdAt: { gte: from } },
        select: { status: true, totalAmount: true, createdAt: true, releasedAt: true, collectionMode: true, isStat: true, branchId: true },
      }),
      this.prisma.labOrder.count({ where: { tenantId, status: 'DELIVERED', createdAt: { gte: from } } }),
      this.prisma.homeCollection.count({ where: { tenantId, createdAt: { gte: from } } }),
      this.prisma.criticalValueAlert.count({ where: { tenantId, createdAt: { gte: from } } }),
      (this.prisma as any).diagnosticAutomationExecution?.groupBy({
        by: ['status'],
        where: { tenantId, createdAt: { gte: from } },
        _count: true,
      }) ?? Promise.resolve([]),
    ]);

    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const avgTat = orders
      .filter(o => o.releasedAt && o.createdAt)
      .map(o => (o.releasedAt!.getTime() - o.createdAt.getTime()) / 3_600_000)
      .reduce((s, t, _, a) => s + t / a.length, 0);

    const statusDist = orders.reduce((acc: any, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1; return acc;
    }, {});

    const revenueTrend = await this.getOrderTrend(tenantId, days);

    return {
      totalOrders: orders.length, delivered, totalRevenue,
      avgTatHours: Math.round(avgTat * 10) / 10,
      homeCollections, criticalAlerts,
      statusDist, revenueTrend,
      automationStats: automationStats.reduce((acc: any, s) => {
        acc[s.status] = s._count; return acc;
      }, {}),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WALLET & BILLING
  // ════════════════════════════════════════════════════════════════════════════

  async getWalletOverview(tenantId: string) {
    let wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
    if (!wallet) {
      wallet = await this.prisma.tenantWallet.create({ data: { tenantId } });
    }
    const [waUsedThisMonth, smsUsedThisMonth] = await Promise.all([
      this.prisma.messageUsageLog.aggregate({
        where: { tenantId, messageType: { in: ['UTILITY', 'MARKETING'] }, sentAt: { gte: new Date(new Date().setDate(1)) } },
        _sum: { creditsCharged: true },
      }),
      this.prisma.messageUsageLog.aggregate({
        where: { tenantId, messageType: 'SMS_FALLBACK' as any, sentAt: { gte: new Date(new Date().setDate(1)) } },
        _count: true,
      }),
    ]);
    return {
      wallet: {
        subscriptionBalancePaise: wallet.subscriptionBalancePaise,
        waCredits: wallet.waCredits,
        smsCredits: wallet.smsCredits,
        storageGbPurchased: wallet.storageGbPurchased,
      },
      usage: {
        waCreditsUsedThisMonth: waUsedThisMonth._sum.creditsCharged ?? 0,
        smsUsedThisMonth: smsUsedThisMonth._count ?? 0,
      },
      autoRecharge: {
        waEnabled: wallet.autoRechargeWaEnabled,
        waThreshold: wallet.autoRechargeWaThreshold,
      },
    };
  }

  async getWalletUsage(tenantId: string, walletType: string, period = '30d') {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[period] ?? 30;
    const from = new Date(); from.setDate(from.getDate() - days);

    if (walletType === 'WHATSAPP') {
      const logs = await this.prisma.messageUsageLog.findMany({
        where: { tenantId, sentAt: { gte: from } },
        orderBy: { sentAt: 'desc' },
      });
      const byType = logs.reduce((acc: any, l) => {
        const k = l.messageType;
        if (!acc[k]) acc[k] = { count: 0, credits: 0 };
        acc[k].count++; acc[k].credits += l.creditsCharged;
        return acc;
      }, {});
      const byTemplate = logs.reduce((acc: any, l) => {
        const k = l.templateCode ?? 'unknown';
        if (!acc[k]) acc[k] = { count: 0, credits: 0 };
        acc[k].count++; acc[k].credits += l.creditsCharged;
        return acc;
      }, {});
      const totalCredits = logs.reduce((s, l) => s + l.creditsCharged, 0);
      return { logs: logs.slice(0, 100), byType, byTemplate, totalCredits, totalMessages: logs.length };
    }

    const txns = await this.prisma.walletTransaction.findMany({
      where: { tenantId, walletType: walletType as any, createdAt: { gte: from } },
      orderBy: { createdAt: 'desc' },
    });
    return { transactions: txns };
  }

  async getRechargePacks(walletType: string) {
    return this.prisma.rechargePack.findMany({
      where: { packType: walletType as any, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getInvoices(tenantId: string, page = 1, limit = 20) {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.hospibotInvoice.findMany({
        where: { tenantId }, skip, take: +limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hospibotInvoice.count({ where: { tenantId } }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getWalletTransactions(tenantId: string, walletType?: string, page = 1, limit = 50) {
    const skip = (+page - 1) * +limit;
    const where: any = { tenantId };
    if (walletType) where.walletType = walletType;
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where, skip, take: +limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total } };
  }



  // ════════════════════════════════════════════════════════════════════════════
  // HEALTH PACKAGES
  // ════════════════════════════════════════════════════════════════════════════

  async listPackages(tenantId: string) {
    // Packages stored in TenantSubType settings or as TestCatalog with type='package'
    // For now use tenant settings JSON store
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = tenant?.settings as any ?? {};
    return (settings.healthPackages ?? []) as any[];
  }

  async createPackage(tenantId: string, dto: {
    name: string; packageType: string; description?: string;
    price: number; testCodes: string[]; isActive?: boolean;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    const packages = settings.healthPackages ?? [];
    const newPkg = { id: Date.now().toString(), ...dto, isActive: dto.isActive ?? true, createdAt: new Date().toISOString() };
    packages.push(newPkg);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, healthPackages: packages } },
    });
    return newPkg;
  }

  async updatePackage(tenantId: string, packageId: string, dto: Partial<{ name: string; price: number; testCodes: string[]; isActive: boolean; description: string; }>) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }, select: { settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    const packages = (settings.healthPackages ?? []).map((p: any) =>
      p.id === packageId ? { ...p, ...dto } : p
    );
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, healthPackages: packages } },
    });
    return packages.find((p: any) => p.id === packageId);
  }



  async seedDefaultAutomationRules(tenantId: string) {
    const DEFAULT_RULES = [
      { name: 'Diabetic Follow-Up (HbA1c)',  testCode: 'HBA1C',   triggerEvent: 'TEST_COMPLETED', waitDays: 90,  templateCode: 'T15', messageText: null },
      { name: 'Thyroid Annual Check',          testCode: 'THYROID', triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17', messageText: null },
      { name: 'Lipid Profile Follow-Up',       testCode: 'LIPID',   triggerEvent: 'TEST_COMPLETED', waitDays: 180, templateCode: 'T15', messageText: null },
      { name: 'Abnormal HbA1c Alert',          testCode: 'HBA1C',   triggerEvent: 'ABNORMAL_RESULT',waitDays: 30,  templateCode: 'T16', messageText: null },
      { name: 'Annual CBC Reminder',           testCode: 'CBC',     triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17', messageText: null },
      { name: 'Vitamin D Yearly',              testCode: 'VITD',    triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17', messageText: null },
      { name: 'Birthday Health Offer',         testCode: null,      triggerEvent: 'BIRTHDAY',       waitDays: 0,   templateCode: 'T20', messageText: null },
    ];
    let seeded = 0;
    for (const rule of DEFAULT_RULES) {
      const exists = await this.prisma.diagnosticAutomationRule.findFirst({
        where: { tenantId, name: rule.name },
      });
      if (!exists) {
        await this.prisma.diagnosticAutomationRule.create({
          data: { tenantId, ...rule, isActive: false },
        });
        seeded++;
      }
    }
    return { seeded };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RATE CARDS
  // ════════════════════════════════════════════════════════════════════════════

  async listRateCards(tenantId: string) {
    // Using tenant settings as a simple store for now (no dedicated table needed)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    return settings.rateCards ?? [];
  }

  async createRateCard(tenantId: string, dto: {
    name: string; type: string; discountPct: number; isDefault: boolean;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    const rateCards = settings.rateCards ?? [];
    const newCard = {
      id: `rc-${Date.now()}`,
      name: dto.name, type: dto.type,
      discountPct: dto.discountPct,
      isDefault: dto.isDefault,
      testOverrides: [],
      createdAt: new Date().toISOString(),
    };
    rateCards.push(newCard);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, rateCards } },
    });
    return newCard;
  }

  async updateRateCard(tenantId: string, cardId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as any) ?? {};
    const rateCards = (settings.rateCards ?? []).map((c: any) =>
      c.id === cardId ? { ...c, ...dto } : c
    );
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, rateCards } },
    });
    return rateCards.find((c: any) => c.id === cardId);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EQUIPMENT LOG
  // ════════════════════════════════════════════════════════════════════════════

  async listEquipmentLogs(tenantId: string, eventType?: string) {
    const where: any = { tenantId };
    if (eventType) where.eventType = eventType;
    const logs = await this.prisma.equipmentLog.findMany({
      where, orderBy: { eventDate: 'desc' }, take: 100,
    });
    const now = new Date();
    return logs.map(l => ({
      ...l,
      isCalibrationOverdue: l.nextCalibration ? l.nextCalibration < now : false,
      isCalibrationSoon: l.nextCalibration
        ? l.nextCalibration >= now && l.nextCalibration < new Date(now.getTime() + 30 * 86_400_000)
        : false,
    }));
  }

  async createEquipmentLog(tenantId: string, userId: string, dto: {
    equipmentName: string; model?: string; serialNumber?: string; department?: string;
    eventType: string; eventDate: string; description?: string;
    downtimeHours?: number; nextCalibration?: string; certificateUrl?: string;
  }) {
    return this.prisma.equipmentLog.create({
      data: {
        tenantId, reportedBy: userId,
        equipmentName: dto.equipmentName, model: dto.model,
        serialNumber: dto.serialNumber, department: dto.department,
        eventType: dto.eventType, eventDate: new Date(dto.eventDate),
        description: dto.description,
        downtimeHours: dto.downtimeHours,
        nextCalibration: dto.nextCalibration ? new Date(dto.nextCalibration) : undefined,
        certificateUrl: dto.certificateUrl,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const date = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    // Atomic counter using DB
    const count = await this.prisma.labOrder.count({
      where: { tenantId, createdAt: { gte: new Date(now.setHours(0,0,0,0)) } },
    });
    return `LAB-${date}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private generateBarcode(orderNumber: string): string {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BC${orderNumber.replace(/[^0-9]/g, '')}${random}`.slice(0, 14);
  }

  private async calculateTatDeadline(tenantId: string, testCode: string, isStat: boolean): Promise<Date | null> {
    try {
      const test = await this.prisma.testCatalog.findFirst({ where: { tenantId, code: testCode, isActive: true } });
      if (!test) return null;
      const hours = isStat ? Math.max(1, test.turnaroundHrs / 2) : test.turnaroundHrs;
      return new Date(Date.now() + hours * 3_600_000);
    } catch { return null; }
  }

  private getTatStatus(order: any): 'on_time' | 'warning' | 'breached' {
    if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status)) return 'on_time';
    const created = new Date(order.createdAt).getTime();
    const elapsed = Date.now() - created;
    const hours = elapsed / 3_600_000;
    // 24h default TAT
    if (hours > 24) return 'breached';
    if (hours > 18) return 'warning';
    return 'on_time';
  }

  private orderStatusToItemStatus(orderStatus: string): string | null {
    const map: Record<string, string> = {
      IN_PROGRESS: 'IN_PROGRESS', RESULTED: 'RESULTED',
      VALIDATED: 'VALIDATED', DELIVERED: 'DELIVERED',
    };
    return map[orderStatus] ?? null;
  }

  private orderStatusToSampleStatus(orderStatus: string): string | null {
    const map: Record<string, string> = {
      SAMPLE_COLLECTED: 'COLLECTED', DISPATCHED: 'DISPATCHED',
      RECEIVED_AT_LAB: 'RECEIVED', IN_PROGRESS: 'IN_PROGRESS',
      DELIVERED: 'RELEASED',
    };
    return map[orderStatus] ?? null;
  }

  private async getRefRange(tenantId: string, testCode: string, patient: any): Promise<any> {
    // Try tenant-specific ranges first
    const age = patient?.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 86_400_000))
      : null;
    const gender = patient?.gender?.toUpperCase();

    let range = await this.prisma.referenceRange.findFirst({
      where: {
        tenantId, testCode,
        ...(age ? { ageMinYears: { lte: age }, ageMaxYears: { gte: age } } : {}),
        ...(gender ? { gender: { in: [gender, 'ALL'] } } : {}),
      },
      orderBy: [{ gender: 'desc' }],
    });

    // Fall back to defaults
    if (!range && DEFAULT_REFERENCE_RANGES[testCode]) {
      range = DEFAULT_REFERENCE_RANGES[testCode][0];
    }
    return range;
  }

  private calculateFlag(value: number | null | undefined, range: any): string {
    if (value === null || value === undefined || !range) return 'NORMAL';
    if (range.lowerCritical !== null && range.lowerCritical !== undefined && value < range.lowerCritical) return 'CRITICAL_LOW';
    if (range.upperCritical !== null && range.upperCritical !== undefined && value > range.upperCritical) return 'CRITICAL_HIGH';
    if (range.lowerNormal !== null && range.lowerNormal !== undefined && value < range.lowerNormal) return 'LOW';
    if (range.upperNormal !== null && range.upperNormal !== undefined && value > range.upperNormal) return 'HIGH';
    return 'NORMAL';
  }

  private async getLatestResultId(orderId: string, orderItemId: string): Promise<string | null> {
    const entry = await this.prisma.resultEntry.findFirst({
      where: { labOrderId: orderId, orderItemId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    return entry?.id ?? null;
  }

  private async fireCriticalValueAlert(tenantId: string, alertData: any, order: any) {
    const alert = await this.prisma.criticalValueAlert.create({
      data: { tenantId, ...alertData, alertSentAt: new Date() },
    });

    // Get referring doctor
    const doctorPhone = order.referringDoctorCrmId
      ? (await this.prisma.doctorCRM.findUnique({ where: { id: order.referringDoctorCrmId }, select: { mobile: true } }))?.mobile
      : null;

    const recipientPhone = doctorPhone ?? order.patient.phone;
    const patName = `${order.patient.firstName} ${order.patient.lastName ?? ''}`.trim();

    await this.whatsapp.sendTextMessage(
      tenantId, recipientPhone,
      `🚨 *CRITICAL VALUE ALERT*\n\n` +
      `Patient: ${patName}\nOrder: ${order.orderNumber}\n` +
      `Test: ${alertData.testName}\n` +
      `Critical Value: *${alertData.criticalValue}* (${alertData.threshold})\n\n` +
      `⚠️ This value requires immediate clinical attention.\n\n` +
      `Reply "ACK ${alert.id.slice(0,8)}" to acknowledge receipt of this alert.`
    ).catch(() => {});
    await this.logMessageUsage(tenantId, recipientPhone, 'UTILITY', 'T07', alertData.labOrderId, 1.0);

    // Schedule escalation if no ack in 30 mins
    setTimeout(async () => {
      const updated = await this.prisma.criticalValueAlert.findUnique({ where: { id: alert.id } });
      if (!updated?.acknowledgedAt) {
        // Escalate to branch manager
        this.logger.warn(`Critical value alert ${alert.id} not acknowledged after 30 min, escalating`);
      }
    }, 30 * 60 * 1000);
  }

  private async sendStatusWhatsApp(tenantId: string, order: any, status: string, rejectionReason?: string) {
    const phone = order.patient?.phone;
    if (!phone) return;
    const messages: Record<string, string> = {
      DISPATCHED: `🚗 *Sample in Transit*\n\nYour sample for order *${order.orderNumber}* is on its way to the lab for processing.`,
      RECEIVED_AT_LAB: `🏥 *Sample Received at Lab*\n\nYour sample for *${order.orderNumber}* has been received at the lab and processing has begun.`,
      IN_PROGRESS: `⚗️ *Tests in Progress*\n\nYour tests for order *${order.orderNumber}* are currently being processed.`,
      REJECTED: `⚠️ *Sample Re-collection Required*\n\nYour sample for *${order.orderNumber}* could not be processed. Reason: ${rejectionReason ?? 'Quality issue'}. Please contact us for re-collection.`,
    };
    if (messages[status]) {
      await this.whatsapp.sendTextMessage(tenantId, phone, messages[status]).catch(() => {});
    }
  }

  private async getExpectedTat(tenantId: string, orderId: string): Promise<string> {
    const items = await this.prisma.orderItem.findMany({
      where: { labOrderId: orderId },
      include: { } as any,
    });
    if (!items.length) return '24 hours';
    const deadlines = items.map(i => (i as any).tatDeadline).filter(Boolean);
    if (!deadlines.length) return '24 hours';
    const maxDeadline = new Date(Math.max(...deadlines.map((d: Date) => d.getTime())));
    return maxDeadline.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private async saveToVault(tenantId: string, order: any, reportId: string) {
    try {
      const uhr = await this.prisma.universalHealthRecord.findFirst({
        where: {
          OR: [
            { mobileNumber: order.patient.phone },
            { mobileNumber: `+91${order.patient.phone.slice(-10)}` },
          ],
        },
      });
      if (!uhr) return;
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
      await this.prisma.healthRecord.create({
        data: {
          uhrId: uhr.id, tenantId,
          tenantName: tenant?.name ?? '',
          recordType: 'LAB',
          title: `Lab Report — ${order.orderNumber}`,
          data: {
            orderNumber: order.orderNumber,
            tests: (order.orderItems ?? order.tests ?? []).map((i: any) => i.testName ?? i.name ?? i),
            reportId,
          },
          recordDate: new Date(),
          attachments: [`${process.env.FRONTEND_URL ?? 'https://hospibot.in'}/report/${order.id}`],
        },
      });
    } catch {}
  }

  private async logMessageUsage(
    tenantId: string, mobile: string, type: string,
    templateCode: string, labOrderId?: string, credits = 1.0,
  ) {
    try {
      await this.prisma.messageUsageLog.create({
        data: { tenantId, recipientMobile: mobile, messageType: type, templateCode, labOrderId, creditsCharged: credits, sentAt: new Date() },
      });
      // Debit wallet
      const wallet = await this.prisma.tenantWallet.findUnique({ where: { tenantId } });
      if (wallet) {
        await this.prisma.tenantWallet.update({
          where: { tenantId },
          data: { waCredits: { decrement: credits } },
        });
      }
    } catch {}
  }
}

  // ── Report Letterhead & Branding ──────────────────────────────────────────

  async getLetterheadConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logoUrl: true, primaryColor: true, settings: true,
        address: true, city: true, state: true, pincode: true, phone: true, email: true, website: true, gstNumber: true },
    });
    if (!tenant) return null;
    const s = (tenant.settings as any) || {};
    return {
      facilityName: tenant.name,
      logoUrl: tenant.logoUrl || null,
      primaryColor: tenant.primaryColor || '0D7C66',
      address: tenant.address, city: tenant.city, state: tenant.state, pincode: tenant.pincode,
      phone: tenant.phone, email: tenant.email, website: tenant.website, gstNumber: tenant.gstNumber,
      // Letterhead-specific settings (stored in settings JSON)
      headerLine1: s.letterhead?.headerLine1 || tenant.name,
      headerLine2: s.letterhead?.headerLine2 || '',
      headerLine3: s.letterhead?.headerLine3 || '',
      footerText: s.letterhead?.footerText || 'This is a computer-generated report. No signature required.',
      signatureLabel: s.letterhead?.signatureLabel || 'Authorized Signatory',
      signatureUrl: s.letterhead?.signatureUrl || null,
      showLogo: s.letterhead?.showLogo !== false,
      showQR: s.letterhead?.showQR !== false,
      showGST: s.letterhead?.showGST !== false,
      reportBrandColor: s.letterhead?.reportBrandColor || tenant.primaryColor || '0D7C66',
      nablCertNo: s.letterhead?.nablCertNo || '',
      nablScope: s.letterhead?.nablScope || '',
      registrationNo: s.letterhead?.registrationNo || '',
      aerbLicense: s.letterhead?.aerbLicense || '',
    };
  }

  async updateLetterheadConfig(tenantId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const s = (tenant?.settings as any) || {};
    
    // Update top-level fields
    const topLevel: any = {};
    if (dto.logoUrl !== undefined) topLevel.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) topLevel.primaryColor = dto.primaryColor;
    if (dto.address !== undefined) topLevel.address = dto.address;
    if (dto.city !== undefined) topLevel.city = dto.city;
    if (dto.state !== undefined) topLevel.state = dto.state;
    if (dto.pincode !== undefined) topLevel.pincode = dto.pincode;
    if (dto.phone !== undefined) topLevel.phone = dto.phone;
    if (dto.email !== undefined) topLevel.email = dto.email;
    if (dto.website !== undefined) topLevel.website = dto.website;

    // Update letterhead settings in JSON
    const letterhead = { ...(s.letterhead || {}) };
    ['headerLine1','headerLine2','headerLine3','footerText','signatureLabel','signatureUrl',
     'showLogo','showQR','showGST','reportBrandColor','nablCertNo','nablScope','registrationNo','aerbLicense'
    ].forEach(k => { if (dto[k] !== undefined) letterhead[k] = dto[k]; });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...topLevel, settings: { ...s, letterhead } as any },
    });

    return this.getLetterheadConfig(tenantId);
  }
