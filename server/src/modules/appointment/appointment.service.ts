import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, RescheduleDto, ListAppointmentsDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate token number for the day: DEPT_CODE-001, DEPT_CODE-002, etc.
   */
  private async generateToken(tenantId: string, departmentId: string | null, date: Date): Promise<string> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    let prefix = 'GEN';
    if (departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (dept?.code) prefix = dept.code;
      else if (dept?.name) prefix = dept.name.substring(0, 3).toUpperCase();
    }

    const count = await this.prisma.appointment.count({
      where: {
        tenantId,
        departmentId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
    });

    return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
  }

  async create(tenantId: string, dto: CreateAppointmentDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // Verify doctor exists and is available
    const doctor = await this.prisma.doctor.findFirst({ where: { id: dto.doctorId, tenantId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!doctor.isAvailable) throw new BadRequestException('Doctor is currently unavailable');

    const scheduledAt = new Date(dto.scheduledAt);
    const duration = dto.duration || doctor.slotDuration;

    // Check for time slot conflicts (same doctor, overlapping time)
    const slotEnd = new Date(scheduledAt.getTime() + duration * 60000);
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        doctorId: dto.doctorId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        scheduledAt: { lt: slotEnd },
        AND: {
          scheduledAt: {
            gte: new Date(scheduledAt.getTime() - duration * 60000),
          },
        },
      },
    });
    if (conflict) throw new ConflictException('This time slot is already booked');

    // Generate token
    const tokenNumber = await this.generateToken(tenantId, dto.departmentId || doctor.departmentId, scheduledAt);

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        branchId: dto.branchId,
        departmentId: dto.departmentId || doctor.departmentId,
        type: dto.type as any,
        status: 'CONFIRMED',
        scheduledAt,
        duration,
        tokenNumber,
        notes: dto.notes,
        source: dto.source || 'web',
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, healthId: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        department: { select: { name: true } },
      },
    });

    return appointment;
  }

  async findById(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, healthId: true, bloodGroup: true, allergies: true, chronicConditions: true, email: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        department: { select: { name: true } },
        branch: { select: { name: true } },
        // visit: true, // removed - not in AppointmentInclude
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async list(tenantId: string, query: ListAppointmentsDto) {
    const { page = 1, limit = 20, date, doctorId, patientId, branchId, status, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (date) {
      const d = new Date(date);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: dayStart, lte: dayEnd };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where, skip, take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, phone: true, healthId: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          department: { select: { name: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Get today's queue for a branch or doctor
   */
  async getQueue(tenantId: string, filters: { branchId?: string; doctorId?: string }) {
    const today = new Date();
    const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today); dayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      tenantId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
    };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.doctorId) where.doctorId = filters.doctorId;

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // IN_PROGRESS first
        { checkedInAt: 'asc' }, // Then by check-in time
        { scheduledAt: 'asc' }, // Then by scheduled time
      ],
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        department: { select: { name: true } },
      },
    });

    // Calculate estimated wait times
    let cumulativeWait = 0;
    const queue = appointments.map((apt, index) => {
      const estimatedWait = apt.status === 'IN_PROGRESS' ? 0 : cumulativeWait;
      if (apt.status !== 'IN_PROGRESS') {
        cumulativeWait += apt.duration;
      }
      return { ...apt, position: index + 1, estimatedWaitMinutes: estimatedWait };
    });

    return {
      queue,
      summary: {
        total: appointments.length,
        waiting: appointments.filter(a => a.status === 'CONFIRMED').length,
        checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
        inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
      },
    };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
      CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
      RESCHEDULED: [],
    };

    const allowed = validTransitions[appointment.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${appointment.status} to ${dto.status}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'CHECKED_IN') updateData.checkedInAt = new Date();
    if (dto.status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (dto.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Update patient's last visit date
      await this.prisma.patient.update({
        where: { id: appointment.patientId },
        data: { lastVisitAt: new Date() },
      });
    }
    if (dto.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = dto.cancelReason;
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Fire automation triggers
    if (dto.status === 'COMPLETED') {
      setImmediate(() => {
        this.triggerAutomation(tenantId, 'VISIT_COMPLETED', appointment.patientId, {
          doctorName: `${updated.doctor?.user?.firstName || ''} ${updated.doctor?.user?.lastName || ''}`.trim(),
        });
      });
    }
    if (dto.status === 'NO_SHOW') {
      setImmediate(() => {
        this.triggerAutomation(tenantId, 'NO_SHOW', appointment.patientId, {});
      });
    }
    if (dto.status === 'CANCELLED') {
      setImmediate(() => {
        this.triggerAutomation(tenantId, 'APPOINTMENT_CANCELLED', appointment.patientId, {});
      });
    }

    return updated;
  }

  private async triggerAutomation(tenantId: string, event: string, patientId: string, metadata: any) {
    try {
      // Dynamically get scheduler to avoid circular dependency
      const { SchedulerService } = await import('../scheduler/scheduler.service');
      // Note: In production, inject SchedulerService properly via constructor
      // For now, fire via direct DB job creation
      const rules = await this.prisma.automationRule.findMany({
        where: { tenantId, isActive: true, trigger: event as any },
      });
      for (const rule of rules) {
        const actions = rule.actions as any[];
        for (const action of actions) {
          await this.prisma.automationJob.create({
            data: {
              tenantId,
              ruleId: rule.id,
              patientId,
              scheduledAt: new Date(Date.now() + rule.waitDays * 24 * 60 * 60 * 1000),
              action: { ...action, ...metadata },
            },
          }).catch(() => {});
        }
      }
    } catch { /* non-blocking */ }
  }

  async reschedule(tenantId: string, id: string, dto: RescheduleDto) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new BadRequestException('Only pending or confirmed appointments can be rescheduled');
    }

    // Mark current as rescheduled
    await this.prisma.appointment.update({
      where: { id },
      data: { status: 'RESCHEDULED', cancelReason: dto.reason || 'Rescheduled' },
    });

    // Create new appointment
    const newScheduledAt = new Date(dto.newScheduledAt);
    const tokenNumber = await this.generateToken(tenantId, appointment.departmentId, newScheduledAt);

    return this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        branchId: appointment.branchId,
        departmentId: appointment.departmentId,
        type: appointment.type,
        status: 'CONFIRMED',
        scheduledAt: newScheduledAt,
        duration: appointment.duration,
        tokenNumber,
        notes: `Rescheduled from ${appointment.scheduledAt.toISOString()}. ${dto.reason || ''}`,
        source: appointment.source,
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  async getTodayStats(tenantId: string) {
    const today = new Date();
    const dayStart = new Date(today); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today); dayEnd.setHours(23, 59, 59, 999);

    const where = { tenantId, scheduledAt: { gte: dayStart, lte: dayEnd } };

    const [total, completed, cancelled, noShow] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
    ]);

    return {
      total,
      completed,
      cancelled,
      noShow,
      pending: total - completed - cancelled - noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

async update(tenantId: string, id: string, dto: any) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    const { status, ...rest } = dto;
    if (status) return this.updateStatus(tenantId, id, { status });
    return this.prisma.appointment.update({
      where: { id },
      data: rest,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, healthId: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }
}