import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Post-checkup consultation workflow for health checkup centers
// Auto-booking triggered by abnormal findings
// Doctor consultation for result discussion + recommendations

@Injectable()
export class ConsultScheduleService {
  private readonly logger = new Logger(ConsultScheduleService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, consultType, status, doctorName, search } = query;
      const where: any = { tenantId };
      if (consultType) where.consultType = consultType;
      if (status) where.status = status;
      if (doctorName) where.doctorName = doctorName;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.consultSchedule.findMany({ where, orderBy: { consultDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.consultSchedule.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.consultSchedule.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      return await this.prisma.consultSchedule.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientPhone: dto.patientPhone || null,
          consultType: dto.consultType || 'post-checkup',
          consultDate: dto.consultDate ? new Date(dto.consultDate) : null,
          timeSlot: dto.timeSlot || null, durationMin: dto.durationMin ? Number(dto.durationMin) : 15,
          doctorName: dto.doctorName || null, doctorSpecialty: dto.doctorSpecialty || null,
          // Trigger
          autoBooked: dto.autoBooked || false,
          triggerReason: dto.triggerReason || null,
          abnormalFindings: dto.abnormalFindings || null,
          healthCheckupId: dto.healthCheckupId || null,
          packageName: dto.packageName || null,
          // Consultation
          chiefComplaint: dto.chiefComplaint || null,
          consultationNotes: dto.consultationNotes || null,
          diagnosis: dto.diagnosis || null,
          prescriptionGiven: dto.prescriptionGiven || false,
          referralGiven: dto.referralGiven || false,
          referralTo: dto.referralTo || null,
          followUpAdvised: dto.followUpAdvised || false,
          followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
          // Employer context
          employerId: dto.employerId || null, employerName: dto.employerName || null,
          notes: dto.notes || null, status: dto.status || 'scheduled',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.consultSchedule.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientPhone', 'consultType', 'timeSlot', 'doctorName',
        'doctorSpecialty', 'autoBooked', 'triggerReason', 'abnormalFindings', 'healthCheckupId',
        'packageName', 'chiefComplaint', 'consultationNotes', 'diagnosis', 'prescriptionGiven',
        'referralGiven', 'referralTo', 'followUpAdvised', 'employerId', 'employerName', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'durationMin'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.consultDate) updateData.consultDate = new Date(dto.consultDate);
      if (dto.followUpDate) updateData.followUpDate = new Date(dto.followUpDate);
      return await this.prisma.consultSchedule.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, referrals] = await Promise.all([
        this.prisma.consultSchedule.count({ where: { tenantId } }),
        this.prisma.consultSchedule.groupBy({ by: ['consultType'], where: { tenantId }, _count: true }),
        this.prisma.consultSchedule.count({ where: { tenantId, referralGiven: true } }),
      ]);
      return { total, referralsGiven: referrals, byType: byType.map(t => ({ type: t.consultType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, referralsGiven: 0, byType: [] }; }
  }
}
