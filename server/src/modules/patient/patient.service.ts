import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePatientDto, UpdatePatientDto, ListPatientsDto } from './dto/patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  private generateHealthId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'HB-';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  async create(tenantId: string, dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findFirst({
      where: { tenantId, phone: dto.phone, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Patient with phone ${dto.phone} already exists`);
    }

    let healthId = this.generateHealthId();
    while (await this.prisma.patient.findUnique({ where: { healthId } })) {
      healthId = this.generateHealthId();
    }

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        healthId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender as any,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        allergies: dto.allergies || [],
        chronicConditions: dto.chronicConditions || [],
        insuranceProvider: dto.insuranceProvider,
        insurancePolicyNo: dto.insurancePolicyNo,
        language: dto.language || 'en',
        tags: dto.tags || [],
        notes: dto.notes,
      },
    });

    // Auto-link to Universal Health Vault (non-blocking)
    setImmediate(async () => {
      try {
        const { VaultService } = await import('../vault/vault.service');
        // Trigger via direct DB operation to avoid circular deps
        const normalized = dto.phone.replace(/\D/g, '').slice(-10);
        const fullNumber = `+91${normalized}`;
        const existingUhr = await this.prisma.universalHealthRecord.findFirst({
          where: { OR: [{ mobileNumber: fullNumber }, { mobileNumber: dto.phone }] },
        });
        if (!existingUhr) {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let uhId = 'HB-';
          for (let i = 0; i < 8; i++) uhId += chars[Math.floor(Math.random() * chars.length)];
          await this.prisma.universalHealthRecord.create({
            data: {
              mobileNumber: fullNumber,
              hospibot_health_id: uhId,
              firstName: dto.firstName,
              lastName: dto.lastName,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
              gender: dto.gender as any,
              bloodGroup: dto.bloodGroup,
              allergies: dto.allergies || [],
              chronicConditions: dto.chronicConditions || [],
            },
          });
        }
      } catch { /* non-blocking */ }
    });

    return patient;
  }

  async findById(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 5,
          include: {
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        prescriptions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        visits: { orderBy: { createdAt: 'desc' }, take: 10 },
        labOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, tests: true, status: true, reportUrl: true, reportDelivered: true, priority: true, createdAt: true, reportedAt: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true, dueAmount: true, status: true, createdAt: true },
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findByPhone(phone: string) {
    return this.prisma.patient.findMany({
      where: { phone, deletedAt: null },
      select: {
        id: true, healthId: true, firstName: true, lastName: true, phone: true,
        gender: true, bloodGroup: true, allergies: true, chronicConditions: true,
        tenantId: true,
        tenant: { select: { name: true, type: true, city: true } },
      },
    });
  }

  async findByHealthId(healthId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { healthId },
      select: {
        id: true, healthId: true, firstName: true, lastName: true, phone: true,
        gender: true, bloodGroup: true, allergies: true, chronicConditions: true, dateOfBirth: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async list(tenantId: string, query: ListPatientsDto) {
    const { page = 1, limit = 20, search, tag, gender, bloodGroup, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { healthId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tag) where.tags = { has: tag };
    if (gender) where.gender = gender;
    if (bloodGroup) where.bloodGroup = bloodGroup;

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, healthId: true, firstName: true, lastName: true, phone: true,
          email: true, gender: true, dateOfBirth: true, bloodGroup: true,
          chronicConditions: true, tags: true, lastVisitAt: true, createdAt: true,
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async update(tenantId: string, id: string, dto: UpdatePatientDto) {
    const existing = await this.prisma.patient.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Patient not found');

    if (dto.phone && dto.phone !== existing.phone) {
      const dup = await this.prisma.patient.findFirst({ where: { tenantId, phone: dto.phone, deletedAt: null, id: { not: id } } });
      if (dup) throw new ConflictException(`Phone ${dto.phone} already registered`);
    }

    return this.prisma.patient.update({
      where: { id },
      data: { ...dto, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined } as any,
    });
  }

  async addTags(tenantId: string, id: string, tags: string[]) {
    const patient = await this.prisma.patient.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!patient) throw new NotFoundException('Patient not found');
    const uniqueTags = [...new Set([...patient.tags, ...tags])];
    return this.prisma.patient.update({ where: { id }, data: { tags: uniqueTags } });
  }

  async removeTag(tenantId: string, id: string, tag: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!patient) throw new NotFoundException('Patient not found');
    return this.prisma.patient.update({ where: { id }, data: { tags: patient.tags.filter(t => t !== tag) } });
  }

  async delete(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!patient) throw new NotFoundException('Patient not found');
    await this.prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Patient archived successfully' };
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, newThisMonth, withFollowUp] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.patient.count({ where: { tenantId, deletedAt: null, createdAt: { gte: monthStart } } }),
      this.prisma.patient.count({ where: { tenantId, deletedAt: null, tags: { has: 'follow-up-pending' } } }),
    ]);
    return { total, newThisMonth, withFollowUp };
  }
}
