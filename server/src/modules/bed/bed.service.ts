import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BedService {
  constructor(private prisma: PrismaService) {}

  // ── Dashboard stats ────────────────────────────────────────────────────────
  async getDashboard(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    const [beds, occupied, reserved, maintenance] = await Promise.all([
      this.prisma.bed.count({ where }),
      this.prisma.bed.count({ where: { ...where, status: 'OCCUPIED' } }),
      this.prisma.bed.count({ where: { ...where, status: 'RESERVED' } }),
      this.prisma.bed.count({ where: { ...where, status: 'MAINTENANCE' } }),
    ]);

    const available = beds - occupied - reserved - maintenance;

    // Beds occupied by category
    const byCategory = await this.prisma.bed.groupBy({
      by: ['category', 'status'],
      where,
      _count: true,
    });

    // Beds with patients (for today's admissions)
    const admittedToday = await this.prisma.bed.count({
      where: {
        ...where,
        status: 'OCCUPIED',
        admittedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const expectedDischarges = await this.prisma.bed.count({
      where: {
        ...where,
        status: 'OCCUPIED',
        expectedDischarge: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    return {
      total: beds,
      available,
      occupied,
      reserved,
      maintenance,
      occupancyRate: beds > 0 ? Math.round((occupied / beds) * 100) : 0,
      admittedToday,
      expectedDischarges,
      byCategory,
    };
  }

  // ── List all beds ──────────────────────────────────────────────────────────
  async getBeds(tenantId: string, filters: {
    branchId?: string;
    ward?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { branchId, ward, category, status, page = 1, limit = 50 } = filters;
    const where: any = { tenantId };
    if (branchId)  where.branchId = branchId;
    if (ward)      where.ward = { contains: ward, mode: 'insensitive' };
    if (category)  where.category = category;
    if (status)    where.status = status;

    const [beds, total] = await Promise.all([
      this.prisma.bed.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ ward: 'asc' }, { number: 'asc' }],
        include: {
          branch: { select: { name: true } },
        },
      }),
      this.prisma.bed.count({ where }),
    ]);

    // Enrich occupied beds with patient info
    const patientIds = beds.filter(b => b.patientId).map(b => b.patientId!);
    let patientMap: Record<string, any> = {};
    if (patientIds.length > 0) {
      const patients = await this.prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, firstName: true, lastName: true, phone: true, dateOfBirth: true, gender: true },
      });
      patientMap = Object.fromEntries(patients.map(p => [p.id, p]));
    }

    const enriched = beds.map(b => ({
      ...b,
      patient: b.patientId ? patientMap[b.patientId] : null,
    }));

    return {
      data: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Create bed ─────────────────────────────────────────────────────────────
  async createBed(tenantId: string, dto: {
    branchId: string;
    ward: string;
    number: string;
    category?: string;
    dailyRate?: number;
    notes?: string;
  }) {
    return this.prisma.bed.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        ward: dto.ward,
        number: dto.number,
        category: (dto.category as any) || 'GENERAL',
        dailyRate: dto.dailyRate || 0,
        notes: dto.notes,
      },
    });
  }

  // ── Update bed ─────────────────────────────────────────────────────────────
  async updateBed(tenantId: string, bedId: string, dto: any) {
    const bed = await this.prisma.bed.findFirst({ where: { id: bedId, tenantId } });
    if (!bed) throw new NotFoundException('Bed not found');
    return this.prisma.bed.update({ where: { id: bedId }, data: dto });
  }

  // ── Admit patient to bed ───────────────────────────────────────────────────
  async admitPatient(tenantId: string, bedId: string, dto: {
    patientId: string;
    expectedDischarge?: string;
    notes?: string;
  }) {
    const bed = await this.prisma.bed.findFirst({ where: { id: bedId, tenantId } });
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status === 'OCCUPIED') throw new BadRequestException('Bed is already occupied');
    if (bed.status === 'MAINTENANCE') throw new BadRequestException('Bed is under maintenance');

    const patient = await this.prisma.patient.findFirst({ where: { id: dto.patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const updated = await this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: 'OCCUPIED',
        patientId: dto.patientId,
        admittedAt: new Date(),
        expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
        notes: dto.notes || bed.notes,
      },
      include: { branch: { select: { name: true } } },
    });

    return { ...updated, patient };
  }

  // ── Discharge patient ──────────────────────────────────────────────────────
  async dischargePatient(tenantId: string, bedId: string, dto: {
    dischargeSummary?: string;
    sendWhatsApp?: boolean;
  }) {
    const bed = await this.prisma.bed.findFirst({ where: { id: bedId, tenantId } });
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status !== 'OCCUPIED') throw new BadRequestException('Bed is not occupied');

    const patient = bed.patientId
      ? await this.prisma.patient.findUnique({ where: { id: bed.patientId } })
      : null;

    // Calculate length of stay
    const admittedAt = bed.admittedAt || new Date();
    const losHours = Math.ceil((Date.now() - admittedAt.getTime()) / (1000 * 60 * 60));
    const losDays = Math.ceil(losHours / 24);
    const bedCharges = losDays * bed.dailyRate; // in paise

    await this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: 'HOUSEKEEPING', // needs cleaning before next patient
        patientId: null,
        admittedAt: null,
        expectedDischarge: null,
        notes: dto.dischargeSummary || null,
      },
    });

    return {
      message: 'Patient discharged successfully',
      patientName: patient ? `${patient.firstName} ${patient.lastName || ''}` : 'Patient',
      lengthOfStay: `${losDays} day${losDays !== 1 ? 's' : ''}`,
      bedCharges,
      bedId,
    };
  }

  // ── Mark bed available after housekeeping ──────────────────────────────────
  async markAvailable(tenantId: string, bedId: string) {
    const bed = await this.prisma.bed.findFirst({ where: { id: bedId, tenantId } });
    if (!bed) throw new NotFoundException('Bed not found');
    return this.prisma.bed.update({
      where: { id: bedId },
      data: { status: 'AVAILABLE' },
    });
  }

  // ── Bulk bed creation (for initial setup) ─────────────────────────────────
  async bulkCreate(tenantId: string, dto: {
    branchId: string;
    ward: string;
    category: string;
    count: number;
    prefix: string;
    startNumber: number;
    dailyRate: number;
  }) {
    const beds = Array.from({ length: dto.count }, (_, i) => ({
      tenantId,
      branchId: dto.branchId,
      ward: dto.ward,
      number: `${dto.prefix}${dto.startNumber + i}`,
      category: dto.category as any,
      dailyRate: dto.dailyRate,
    }));

    return this.prisma.bed.createMany({ data: beds, skipDuplicates: true });
  }

  // ── Get ward summary ───────────────────────────────────────────────────────
  async getWards(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    const beds = await this.prisma.bed.findMany({
      where,
      select: { ward: true, status: true, category: true },
    });

    const wardMap: Record<string, { total: number; available: number; occupied: number; reserved: number }> = {};
    beds.forEach(b => {
      if (!wardMap[b.ward]) wardMap[b.ward] = { total: 0, available: 0, occupied: 0, reserved: 0 };
      wardMap[b.ward].total++;
      if (b.status === 'AVAILABLE') wardMap[b.ward].available++;
      else if (b.status === 'OCCUPIED') wardMap[b.ward].occupied++;
      else if (b.status === 'RESERVED') wardMap[b.ward].reserved++;
    });

    return Object.entries(wardMap).map(([ward, stats]) => ({ ward, ...stats }));
  }
}
