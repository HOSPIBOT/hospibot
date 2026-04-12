import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

const COMMON_DRUGS = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Metformin',
  'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Pantoprazole', 'Cetirizine',
  'Monteleukast', 'Salbutamol Inhaler', 'Prednisolone', 'Metronidazole',
  'Ciprofloxacin', 'Doxycycline', 'Cefixime', 'Losartan', 'Telmisartan',
  'Aspirin', 'Clopidogrel', 'Vitamin B12', 'Vitamin D3', 'Iron + Folic Acid',
  'Calcium Carbonate', 'Ranitidine', 'Levofloxacin', 'Tramadol', 'Diclofenac',
  'Ondansetron', 'Domperidone', 'Metoclopramide', 'Loperamide', 'ORS Sachet',
];

const FREQUENCIES = [
  'Once daily (OD)', 'Twice daily (BD)', 'Three times daily (TDS)', 
  'Four times daily (QDS)', 'Every 8 hours (Q8H)', 'Every 12 hours (Q12H)',
  'At bedtime (HS)', 'Before food (AC)', 'After food (PC)', 'Immediately (STAT)',
  'As needed (SOS)', 'Alternate day', 'Once weekly',
];

const DURATIONS = [
  '1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days',
  '21 days', '1 month', '2 months', '3 months', '6 months', 'Ongoing',
];

const ROUTES = [
  'Oral', 'Sublingual', 'Inhalation', 'Topical', 'Eye drops', 'Ear drops',
  'Nasal drops', 'IV', 'IM', 'SC', 'Rectal',
];

@Injectable()
export class PrescriptionService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ── Create Prescription ───────────────────────────────────────────────────

  async create(tenantId: string, dto: {
    patientId: string; doctorId: string; visitId?: string;
    medications: Array<{
      name: string; genericName?: string; dosage: string; frequency: string;
      duration: string; route?: string; instructions?: string; refillable?: boolean;
    }>;
    diagnosis?: string; complaints?: string; vitals?: any;
    notes?: string; followUpDays?: number;
  }) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId, deletedAt: null },
      select: { firstName: true, phone: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const refillDueDate = dto.medications.some(m => m.refillable)
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const prescription = await this.prisma.prescription.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        visitId: dto.visitId,
        medications: dto.medications as any,
        notes: dto.notes,
        refillDueDate,
        isActive: true,
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Auto-schedule refill reminders via automation
    if (refillDueDate) {
      await this.prisma.automationJob.create({
        data: {
          tenantId,
          ruleId: 'system-refill-reminder',
          patientId: dto.patientId,
          scheduledAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
          status: 'PENDING',
          action: {
            type: 'SEND_WHATSAPP',
            message: `Hi ${patient.firstName}, your prescription from Dr. ${prescription.doctor.user.firstName} is due for a refill in 5 days. Medicines: ${dto.medications.map(m => m.name).join(', ')}. Please visit us or request a refill.`,
          },
        },
      }).catch(() => {});
    }

    return prescription;
  }

  // ── List for patient ──────────────────────────────────────────────────────

  async listByPatient(tenantId: string, patientId: string) {
    return this.prisma.prescription.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  // ── Get single ────────────────────────────────────────────────────────────

  async getById(tenantId: string, id: string) {
    const rx = await this.prisma.prescription.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true, dateOfBirth: true, bloodGroup: true, allergies: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return rx;
  }

  // ── Send prescription via WhatsApp ────────────────────────────────────────

  async sendViaWhatsApp(tenantId: string, id: string) {
    const rx = await this.getById(tenantId, id);
    const meds = rx.medications as any[];
    const doctorName = `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName || ''}`.trim();

    const medList = meds.map(m =>
      `💊 *${m.name}* ${m.dosage}\n   ${m.frequency} for ${m.duration}${m.instructions ? '\n   ' + m.instructions : ''}`
    ).join('\n\n');

    const msg = `🏥 *Prescription from HospiBot*\n\nPatient: *${rx.patient.firstName} ${rx.patient.lastName || ''}*\nDoctor: *${doctorName}*\nDate: ${new Date(rx.createdAt).toLocaleDateString('en-IN')}\n\n*MEDICATIONS:*\n\n${medList}${rx.notes ? '\n\n📝 *Notes:* ' + rx.notes : ''}\n\n_Please take medicines as prescribed. Contact us for any queries._`;

    await this.whatsappService.sendTextMessage(tenantId, rx.patient.phone, msg);
    return { sent: true, to: rx.patient.phone };
  }

  // ── Metadata for drug picker ──────────────────────────────────────────────

  getMetadata() {
    return { drugs: COMMON_DRUGS, frequencies: FREQUENCIES, durations: DURATIONS, routes: ROUTES };
  }

  // ── List all (for prescriptions page) ────────────────────────────────────

  async listAll(tenantId: string, filters: any) {
    const { page = 1, limit = 20, search, doctorId, isActive } = filters;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (doctorId) where.doctorId = doctorId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true, phone: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data, meta: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
