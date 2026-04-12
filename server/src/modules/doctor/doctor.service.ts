import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto, SetScheduleDto, ListDoctorsDto } from './dto/doctor.dto';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDoctorDto) {
    // Verify user exists and doesn't already have a doctor profile
    const existingDoctor = await this.prisma.doctor.findUnique({ where: { userId: dto.userId } });
    if (existingDoctor) throw new ConflictException('This user already has a doctor profile');

    const user = await this.prisma.user.findFirst({ where: { id: dto.userId, tenantId } });
    if (!user) throw new NotFoundException('User not found in this tenant');

    return this.prisma.doctor.create({
      data: {
        tenantId,
        userId: dto.userId,
        departmentId: dto.departmentId,
        registrationNo: dto.registrationNo,
        specialties: dto.specialties || [],
        qualifications: dto.qualifications,
        experience: dto.experience,
        consultationFee: dto.consultationFee,
        bio: dto.bio,
        slotDuration: dto.slotDuration || 15,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async list(tenantId: string, query: ListDoctorsDto) {
    const { page = 1, limit = 20, search, departmentId, specialty, availableOnly } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;
    if (specialty) where.specialties = { has: specialty };
    if (availableOnly) where.isAvailable = true;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { specialties: { has: search } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async update(tenantId: string, id: string, dto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findFirst({ where: { id, tenantId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async setSchedule(tenantId: string, id: string, dto: SetScheduleDto) {
    const doctor = await this.prisma.doctor.findFirst({ where: { id, tenantId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const settings = (doctor.settings as any) || {};
    settings.schedule = dto.schedule;

    return this.prisma.doctor.update({
      where: { id },
      data: { settings },
    });
  }

  /**
   * Get available appointment slots for a doctor on a given date
   */
  async getAvailableSlots(tenantId: string, doctorId: string, date: string) {
    const doctor = await this.prisma.doctor.findFirst({ where: { id: doctorId, tenantId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!doctor.isAvailable) return { slots: [], message: 'Doctor is currently unavailable' };

    const targetDate = new Date(date);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const settings = doctor.settings as any;
    const schedule = settings?.schedule?.[dayName];

    if (!schedule) return { slots: [], message: `Doctor does not work on ${dayName}s` };

    // Generate time slots
    const slots: { time: string; available: boolean }[] = [];
    const [startH, startM] = schedule.start.split(':').map(Number);
    const [endH, endM] = schedule.end.split(':').map(Number);
    const breakStart = schedule.breakStart ? schedule.breakStart.split(':').map(Number) : null;
    const breakEnd = schedule.breakEnd ? schedule.breakEnd.split(':').map(Number) : null;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDuration = doctor.slotDuration;

    while (currentMinutes + slotDuration <= endMinutes) {
      // Check if in break period
      if (breakStart && breakEnd) {
        const breakStartMin = breakStart[0] * 60 + breakStart[1];
        const breakEndMin = breakEnd[0] * 60 + breakEnd[1];
        if (currentMinutes >= breakStartMin && currentMinutes < breakEndMin) {
          currentMinutes = breakEndMin;
          continue;
        }
      }

      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      slots.push({ time: timeStr, available: true });
      currentMinutes += slotDuration;
    }

    // Check existing appointments and mark booked slots
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
      select: { scheduledAt: true },
    });

    const bookedTimes = new Set(
      bookedAppointments.map(a => {
        const d = new Date(a.scheduledAt);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }),
    );

    slots.forEach(slot => {
      if (bookedTimes.has(slot.time)) slot.available = false;
    });

    return {
      doctorId,
      date,
      slotDuration,
      slots,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length,
    };
  }
}
