import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

// ── Default test catalog (seeded on first use) ─────────────────────────────

const DEFAULT_TESTS = [
  // Haematology
  { code: 'CBC',    name: 'Complete Blood Count',          category: 'Haematology',   price: 25000,  sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'ESR',    name: 'Erythrocyte Sedimentation Rate', category: 'Haematology',   price: 8000,   sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'PT',     name: 'Prothrombin Time (PT/INR)',      category: 'Haematology',   price: 18000,  sampleType: 'Blood', turnaroundHrs: 6  },
  // Biochemistry
  { code: 'LFT',    name: 'Liver Function Test',            category: 'Biochemistry',  price: 45000,  sampleType: 'Blood', turnaroundHrs: 12 },
  { code: 'KFT',    name: 'Kidney Function Test',           category: 'Biochemistry',  price: 45000,  sampleType: 'Blood', turnaroundHrs: 12 },
  { code: 'FBS',    name: 'Fasting Blood Sugar',            category: 'Biochemistry',  price: 8000,   sampleType: 'Blood', turnaroundHrs: 2  },
  { code: 'PPBS',   name: 'Post Prandial Blood Sugar',      category: 'Biochemistry',  price: 8000,   sampleType: 'Blood', turnaroundHrs: 2  },
  { code: 'HBA1C',  name: 'Glycosylated Haemoglobin (HbA1c)', category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
  { code: 'LIPID',  name: 'Lipid Profile',                  category: 'Biochemistry',  price: 55000,  sampleType: 'Blood', turnaroundHrs: 12 },
  { code: 'THYROID', name: 'Thyroid Function Test (T3/T4/TSH)', category: 'Biochemistry', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
  { code: 'VITD',   name: 'Vitamin D (25-OH)',               category: 'Biochemistry',  price: 85000,  sampleType: 'Blood', turnaroundHrs: 24 },
  { code: 'VITB12', name: 'Vitamin B12',                    category: 'Biochemistry',  price: 65000,  sampleType: 'Blood', turnaroundHrs: 24 },
  { code: 'UA',     name: 'Uric Acid',                      category: 'Biochemistry',  price: 12000,  sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'CRP',    name: 'C-Reactive Protein (CRP)',       category: 'Biochemistry',  price: 35000,  sampleType: 'Blood', turnaroundHrs: 6  },
  // Urine
  { code: 'UCR',    name: 'Urine Complete Routine',         category: 'Urine',         price: 12000,  sampleType: 'Urine', turnaroundHrs: 2  },
  { code: 'UACR',   name: 'Urine Albumin Creatinine Ratio', category: 'Urine',         price: 25000,  sampleType: 'Urine', turnaroundHrs: 4  },
  // Microbiology
  { code: 'BC',     name: 'Blood Culture & Sensitivity',    category: 'Microbiology',  price: 85000,  sampleType: 'Blood', turnaroundHrs: 72 },
  { code: 'UC',     name: 'Urine Culture & Sensitivity',    category: 'Microbiology',  price: 65000,  sampleType: 'Urine', turnaroundHrs: 72 },
  // Serology
  { code: 'WIDAL',  name: 'Widal Test',                     category: 'Serology',      price: 18000,  sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'HBsAg',  name: 'Hepatitis B Surface Antigen',    category: 'Serology',      price: 25000,  sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'HIVAB',  name: 'HIV Antibody Test',               category: 'Serology',      price: 25000,  sampleType: 'Blood', turnaroundHrs: 4  },
  { code: 'DENGUE', name: 'Dengue NS1 Antigen',             category: 'Serology',      price: 55000,  sampleType: 'Blood', turnaroundHrs: 4  },
  // Hormones
  { code: 'FSH',    name: 'Follicle Stimulating Hormone',   category: 'Hormones',      price: 45000,  sampleType: 'Blood', turnaroundHrs: 24 },
  { code: 'LH',     name: 'Luteinizing Hormone',            category: 'Hormones',      price: 45000,  sampleType: 'Blood', turnaroundHrs: 24 },
  { code: 'PROGEST', name: 'Progesterone',                   category: 'Hormones',      price: 55000,  sampleType: 'Blood', turnaroundHrs: 24 },
  // Stool
  { code: 'STOOL',  name: 'Stool Routine & Microscopy',     category: 'Stool',         price: 10000,  sampleType: 'Stool', turnaroundHrs: 4  },
];

// ── Status transitions ─────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDERED:          ['SAMPLE_COLLECTED', 'CANCELLED'],
  SAMPLE_COLLECTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING:       ['COMPLETED', 'CANCELLED'],
  COMPLETED:        ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

@Injectable()
export class LabService {
  private readonly logger = new Logger(LabService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ── Seed default test catalog ──────────────────────────────────────────────

  async seedDefaultCatalog(tenantId: string): Promise<number> {
    let seeded = 0;
    for (const test of DEFAULT_TESTS) {
      const exists = await this.prisma.testCatalog.findUnique({
        where: { tenantId_code: { tenantId, code: test.code } },
      });
      if (!exists) {
        await this.prisma.testCatalog.create({ data: { tenantId, ...test } });
        seeded++;
      }
    }
    return seeded;
  }

  // ── Test Catalog CRUD ──────────────────────────────────────────────────────

  async listCatalog(tenantId: string, search?: string, category?: string) {
    try {
      const where: any = { tenantId, isActive: true };
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }
      const tests = await this.prisma.testCatalog.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      const grouped = tests.reduce((acc: any, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {});

      return { data: tests, grouped, total: tests.length };
    } catch (err) {
      this.logger.error('listCatalog failed', err?.message);
      return { data: [], grouped: {}, total: 0 };
    }
  }

  async createTest(tenantId: string, dto: any) {
    return this.prisma.testCatalog.create({
      data: { tenantId, ...dto, price: Math.round(dto.price * 100) },
    });
  }

  async updateTest(tenantId: string, id: string, dto: any) {
    const test = await this.prisma.testCatalog.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException('Test not found');
    return this.prisma.testCatalog.update({ where: { id }, data: dto });
  }

  async deleteTest(tenantId: string, id: string) {
    await this.prisma.testCatalog.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  // ── Lab Orders ─────────────────────────────────────────────────────────────

  async createOrder(tenantId: string, dto: any) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const orderNumber = `LB-${Date.now().toString().slice(-8)}`;
    const barcode     = `BC${Date.now().toString().slice(-10)}`;

    const order = await this.prisma.labOrder.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId || null,
        orderNumber,
        tests: dto.tests || [],
        priority: dto.priority || 'normal',
        notes: dto.notes,
        sampleBarcode: barcode,
        referringDoctor: dto.referringDoctor,
        clinicalInfo: dto.clinicalInfo,
      } as any,
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    // Send booking confirmation via WhatsApp
    await this.whatsappService.sendTextMessage(
      tenantId,
      patient.phone,
      `🧪 *Lab Test Order Confirmed*\n\nOrder: *${orderNumber}*\nTests: ${(dto.tests as any[]).map((t: any) => t.testName || t.name).join(', ')}\nSample: ${order.priority === 'urgent' ? '⚡ URGENT' : 'Normal priority'}\n\nPlease collect your collection slip from the lab counter.\nBarcode: ${barcode}\n\nWe will notify you when your report is ready.`
    ).catch(() => {});

    return order;
  }

  async listOrders(tenantId: string, filters: any) {
    try {
      const { page = 1, limit = 20, status, priority, search, date } = filters;
      const skip = (page - 1) * limit;
      const where: any = { tenantId };

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (date) {
        const d = new Date(date);
        where.createdAt = {
          gte: new Date(d.setHours(0, 0, 0, 0)),
          lte: new Date(d.setHours(23, 59, 59, 999)),
        };
      }
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { patient: { firstName: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search } } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.labOrder.findMany({
          where, skip, take: limit,
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
          include: {
            patient: { select: { firstName: true, lastName: true, phone: true, healthId: true } },
          },
        }),
        this.prisma.labOrder.count({ where }),
      ]);

      return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (err) {
      this.logger.error('listOrders failed', err?.message);
      return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }
  }

  async getOrderById(tenantId: string, id: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, healthId: true, dateOfBirth: true, gender: true } },
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async updateStatus(tenantId: string, id: string, newStatus: string) {
    const order = await this.prisma.labOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${order.status} to ${newStatus}. Allowed: ${allowed.join(', ')}`
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'SAMPLE_COLLECTED') updateData.sampleCollectedAt = new Date();
    if (newStatus === 'COMPLETED') updateData.reportedAt = new Date();

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: updateData,
      include: { patient: { select: { firstName: true, phone: true } } },
    });

    // Auto-send WhatsApp when sample collected
    if (newStatus === 'SAMPLE_COLLECTED') {
      await this.whatsappService.sendTextMessage(
        tenantId,
        updated.patient.phone,
        `✅ *Sample Collected*\n\nYour sample for order *${updated.orderNumber}* has been collected successfully.\n\nWe will process your tests and notify you when the report is ready. Estimated turnaround: ${updated.priority === 'urgent' ? '4-6 hours' : '12-24 hours'}.`
      ).catch(() => {});
    }

    return updated;
  }

  // ── Report Upload & WhatsApp Delivery ──────────────────────────────────────

  async uploadReport(tenantId: string, id: string, reportUrl: string, reportData?: any) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: { patient: { select: { firstName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Update order with report URL and mark completed/delivered
    await this.prisma.labOrder.update({
      where: { id },
      data: {
        reportUrl,
        status: 'DELIVERED',
        reportDelivered: true,
        reportedAt: new Date(),
        tests: reportData?.tests || order.tests,
        waSent: true,
      } as any,
    });

    // Auto-deliver report via WhatsApp
    const patientName = order.patient.firstName;
    await this.whatsappService.sendTextMessage(
      tenantId,
      order.patient.phone,
      `📄 *Your Lab Report is Ready!*\n\nHi ${patientName},\n\nYour report for order *${order.orderNumber}* is ready.\n\n📥 Download your report:\n${reportUrl}\n\n_This link is valid for 30 days. If you have any questions about your results, please consult your doctor._\n\n🏥 Thank you for choosing us.`
    ).catch(() => {});

    // Also add to Universal Health Vault
    await this.addToVault(tenantId, order, reportUrl, reportData);

    return { delivered: true, sentTo: order.patient.phone };
  }

  private async addToVault(tenantId: string, order: any, reportUrl: string, reportData?: any) {
    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
      const uhr = await this.prisma.universalHealthRecord.findFirst({
        where: {
          OR: [
            { mobileNumber: order.patient.phone },
            { mobileNumber: `+91${order.patient.phone.slice(-10)}` },
          ],
        },
      });
      if (!uhr) return;

      await this.prisma.healthRecord.create({
        data: {
          uhrId: uhr.id,
          tenantId,
          tenantName: tenant?.name || '',
          recordType: 'LAB',
          title: `Lab Report — ${order.orderNumber}`,
          data: { orderNumber: order.orderNumber, tests: order.tests, ...(reportData || {}) },
          attachments: [reportUrl],
          recordDate: new Date(),
        },
      });
    } catch { /* non-blocking */ }
  }

  // ── Dashboard Analytics ────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today.getTime() + 86400000 - 1);

      const [todayOrders, pending, processing, completed, urgent, revenue] = await Promise.all([
        this.prisma.labOrder.count({ where: { tenantId, createdAt: { gte: today, lte: todayEnd } } }),
        this.prisma.labOrder.count({ where: { tenantId, status: { in: ['ORDERED', 'SAMPLE_COLLECTED'] } } }),
        this.prisma.labOrder.count({ where: { tenantId, status: 'PROCESSING' } }),
        this.prisma.labOrder.count({ where: { tenantId, status: { in: ['COMPLETED', 'DELIVERED'] }, reportedAt: { gte: today } } }),
        this.prisma.labOrder.count({ where: { tenantId, priority: 'urgent', status: { not: 'CANCELLED' } } }),
        this.prisma.invoice.aggregate({
          where: { tenantId, createdAt: { gte: today } },
          _sum: { totalAmount: true },
        }),
      ]);

      return {
        todayOrders, pending, processing, completed, urgent,
        todayRevenue: revenue._sum.totalAmount || 0,
      };
    } catch (err) {
      this.logger.error('getDashboardStats failed', err?.message);
      return { todayOrders: 0, pending: 0, processing: 0, completed: 0, urgent: 0, todayRevenue: 0 };
    }
  }

  async getTrend(tenantId: string, days = 14) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const orders = await this.prisma.labOrder.findMany({
      where: { tenantId, createdAt: { gte: from } },
      select: { createdAt: true, status: true, priority: true },
    });

    const byDate: Record<string, { date: string; orders: number; completed: number }> = {};
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      byDate[key] = { date: key, orders: 0, completed: 0 };
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (byDate[key]) {
        byDate[key].orders++;
        if (['COMPLETED', 'DELIVERED'].includes(o.status)) byDate[key].completed++;
      }
    }

    return Object.values(byDate);
  }

  // ── Home Collection ────────────────────────────────────────────────────────

  async scheduleHomeCollection(tenantId: string, dto: any) {
    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId, deletedAt: null } });
    if (!patient) throw new NotFoundException('Patient not found');

    const collection = await this.prisma.homeCollection.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        labOrderId: dto.labOrderId,
        scheduledAt: new Date(dto.scheduledAt),
        address: dto.address,
        city: dto.city,
        pincode: dto.pincode,
        contactPhone: dto.contactPhone || patient.phone,
        notes: dto.notes,
      } as any,
    });

    // Confirm via WhatsApp
    await this.whatsappService.sendTextMessage(
      tenantId,
      patient.phone,
      `🏠 *Home Sample Collection Confirmed*\n\nDate: ${new Date(dto.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\nTime: ${new Date(dto.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\nAddress: ${dto.address}, ${dto.city}\n\nOur technician will arrive at your location. Please have a valid ID ready.\n\nFor any changes, please call us immediately.`
    ).catch(() => {});

    return collection;
  }

  async listHomeCollections(tenantId: string, filters: any) {
    try {
      const { page = 1, limit = 20, status, date } = filters;
      const skip = (page - 1) * limit;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (date) {
        const d = new Date(date);
        where.scheduledAt = {
          gte: new Date(d.setHours(0, 0, 0, 0)),
          lte: new Date(d.setHours(23, 59, 59, 999)),
        };
      }
      const [data, total] = await Promise.all([
        this.prisma.homeCollection.findMany({
          where, skip, take: limit,
          orderBy: { scheduledAt: 'asc' },
          include: { patient: { select: { firstName: true, lastName: true, phone: true } } },
        }),
        this.prisma.homeCollection.count({ where }),
      ]);
      return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (err) {
      this.logger.error('listHomeCollections failed', err?.message);
      return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }

  async updateCollectionStatus(tenantId: string, id: string, status: string, technicianName?: string) {
    const collection = await this.prisma.homeCollection.findFirst({ where: { id, tenantId } });
    if (!collection) throw new NotFoundException('Collection not found');

    const updateData: any = { status };
    if (technicianName) updateData.technicianName = technicianName;
    if (status === 'COLLECTED') updateData.collectedAt = new Date();

    return this.prisma.homeCollection.update({ where: { id }, data: updateData });
  }

// ── Update order fields ────────────────────────────────────────────────────

  async updateOrder(tenantId: string, id: string, dto: { reportUrl?: string; remarks?: string; notes?: string }) {
    const order = await this.prisma.labOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Lab order not found');

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        ...(dto.reportUrl ? { reportUrl: dto.reportUrl } : {}),
        ...(dto.remarks   ? { remarks: dto.remarks }     : {}),
        ...(dto.notes     ? { notes: dto.notes }         : {}),
      },
    });

    // If report URL provided, also deliver via WhatsApp and mark delivered
    if (dto.reportUrl) {
      await this.uploadReport(tenantId, id, dto.reportUrl).catch(() => {});
    }

    return updated;
  }

  // ── Re-deliver existing report ─────────────────────────────────────────────

  async deliverReport(tenantId: string, id: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: { patient: { select: { firstName: true, phone: true } } },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    if (!order.reportUrl) throw new BadRequestException('No report URL uploaded yet');

    await this.uploadReport(tenantId, id, order.reportUrl).catch(() => {});
    return { delivered: true, to: order.patient?.phone };
  }
}