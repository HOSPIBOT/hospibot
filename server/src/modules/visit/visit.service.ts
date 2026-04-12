// visit.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    // Check if visit already exists for this appointment
    const existing = dto.appointmentId
      ? await this.prisma.visit.findFirst({ where: { tenantId, appointmentId: dto.appointmentId } })
      : null;

    if (existing) {
      return this.prisma.visit.update({
        where: { id: existing.id },
        data: {
          vitals: dto.vitals || existing.vitals,
          chiefComplaint: dto.chiefComplaint,
          diagnosisText: dto.diagnosisText,
          clinicalNotes: dto.clinicalNotes,
          treatmentPlan: dto.treatmentPlan,
          followUpDays: dto.followUpDays ? Number(dto.followUpDays) : undefined,
        },
      });
    }

    return this.prisma.visit.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
        vitals: dto.vitals || {},
        chiefComplaint: dto.chiefComplaint,
        diagnosisText: dto.diagnosisText,
        diagnosisCodes: dto.diagnosisCodes || [],
        clinicalNotes: dto.clinicalNotes,
        treatmentPlan: dto.treatmentPlan,
        followUpDays: dto.followUpDays ? Number(dto.followUpDays) : undefined,
        visitType: dto.visitType || 'OPD',
        source: dto.source || 'manual',
      },
    });
  }

  async listByPatient(tenantId: string, patientId: string) {
    return this.prisma.visit.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        prescriptions: { include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
  }

  async getById(tenantId: string, id: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, dateOfBirth: true, bloodGroup: true, allergies: true, chronicConditions: true } },
        prescriptions: true,
        invoices: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async getByAppointment(tenantId: string, appointmentId: string) {
    return this.prisma.visit.findFirst({
      where: { tenantId, appointmentId },
    });
  }
}
