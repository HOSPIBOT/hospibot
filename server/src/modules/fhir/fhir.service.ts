import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const FHIR_BASE = process.env.API_URL || 'https://api.hospibot.ai';

@Injectable()
export class FhirService {
  constructor(private prisma: PrismaService) {}

  // ── Capability Statement ───────────────────────────────────────────────────
  getCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      id: 'hospibot-fhir-r4',
      status: 'active',
      date: new Date().toISOString(),
      publisher: 'HospiBot',
      kind: 'instance',
      software: { name: 'HospiBot Healthcare OS', version: '1.0' },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [{
        mode: 'server',
        resource: [
          { type: 'Patient',            interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'Observation',         interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'MedicationRequest',   interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'Condition',           interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'DiagnosticReport',    interaction: [{ code: 'read' }, { code: 'search-type' }] },
          { type: 'Appointment',         interaction: [{ code: 'read' }, { code: 'search-type' }] },
        ],
      }],
    };
  }

  // ── Patient ───────────────────────────────────────────────────────────────
  private toFhirPatient(p: any) {
    return {
      resourceType: 'Patient',
      id: p.id,
      meta: { lastUpdated: p.updatedAt },
      identifier: [
        { system: 'https://hospibot.ai/patient-id', value: p.id },
        ...(p.healthId ? [{ system: 'https://hospibot.ai/health-id', value: p.healthId }] : []),
        ...(p.abhaId   ? [{ system: 'https://abdm.gov.in/abha',      value: p.abhaId   }] : []),
      ],
      active: p.deletedAt === null,
      name: [{ use: 'official', given: [p.firstName], family: p.lastName || '' }],
      telecom: [
        ...(p.phone ? [{ system: 'phone', value: p.phone, use: 'mobile' }] : []),
        ...(p.email ? [{ system: 'email', value: p.email              }] : []),
      ],
      gender: p.gender?.toLowerCase() || 'unknown',
      birthDate: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0,10) : undefined,
      address: p.address ? [{ text: p.address, city: p.city }] : undefined,
      extension: [
        ...(p.bloodGroup ? [{ url: 'http://hl7.org/fhir/StructureDefinition/patient-bloodGroup', valueString: p.bloodGroup }] : []),
        ...(p.allergies?.length ? [{ url: 'http://hl7.org/fhir/StructureDefinition/patient-allergies', valueString: p.allergies.join(', ') }] : []),
      ],
    };
  }

  async searchPatients(q: { phone?: string; identifier?: string; name?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)    where.tenantId = q.tenantId;
    if (q.phone)       where.phone = { contains: q.phone.replace(/\D/g,'').slice(-10) };
    if (q.identifier)  where.OR = [{ id: q.identifier }, { healthId: q.identifier }];
    if (q.name)        where.OR = [{ firstName: { contains: q.name, mode: 'insensitive' } }, { lastName: { contains: q.name, mode: 'insensitive' } }];

    const patients = await this.prisma.patient.findMany({ where, take: q.count || 10 });
    return {
      resourceType: 'Bundle', type: 'searchset',
      total: patients.length,
      entry: patients.map(p => ({ fullUrl: `${FHIR_BASE}/fhir/r4/Patient/${p.id}`, resource: this.toFhirPatient(p) })),
    };
  }

  async getPatient(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const p = await this.prisma.patient.findFirst({ where });
    if (!p) return { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient not found' }] };
    return this.toFhirPatient(p);
  }

  // ── Observation (vitals from visits) ─────────────────────────────────────
  private toFhirObservation(visit: any, vitalKey: string, value: any) {
    const VITAL_CODES: Record<string, { code: string; display: string; unit: string; system: string }> = {
      bloodPressure:  { code: '85354-9', display: 'Blood pressure', unit: 'mmHg', system: 'http://loinc.org' },
      heartRate:      { code: '8867-4',  display: 'Heart rate',     unit: '/min', system: 'http://loinc.org' },
      temperature:    { code: '8310-5',  display: 'Body temperature', unit: '°C', system: 'http://loinc.org' },
      spO2:           { code: '59408-5', display: 'Oxygen saturation', unit: '%', system: 'http://loinc.org' },
      weight:         { code: '29463-7', display: 'Body weight',    unit: 'kg',   system: 'http://loinc.org' },
      height:         { code: '8302-2',  display: 'Body height',    unit: 'cm',   system: 'http://loinc.org' },
    };
    const coding = VITAL_CODES[vitalKey];
    if (!coding) return null;
    return {
      resourceType: 'Observation',
      id: `${visit.id}-${vitalKey}`,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: coding.system, code: coding.code, display: coding.display }] },
      subject: { reference: `Patient/${visit.patientId}` },
      effectiveDateTime: visit.createdAt,
      valueString: String(value),
      valueQuantity: typeof value === 'number' ? { value, unit: coding.unit } : undefined,
    };
  }

  async searchObservations(q: { patientId?: string; category?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)  where.tenantId  = q.tenantId;
    if (q.patientId) where.patientId = q.patientId;
    const visits = await this.prisma.visit.findMany({ where, take: q.count || 20, orderBy: { createdAt: 'desc' } });
    const observations: any[] = [];
    for (const v of visits) {
      const vitals: any = v.vitals || {};
      ['bloodPressure','heartRate','temperature','spO2','weight','height'].forEach(k => {
        if (vitals[k]) {
          const obs = this.toFhirObservation(v, k, vitals[k]);
          if (obs) observations.push(obs);
        }
      });
    }
    return { resourceType: 'Bundle', type: 'searchset', total: observations.length, entry: observations.map(r => ({ resource: r })) };
  }

  async getObservation(id: string) {
    const [visitId, vitalKey] = id.split('-');
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] };
    const vitals: any = visit.vitals || {};
    return this.toFhirObservation(visit, vitalKey, vitals[vitalKey]) || { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] };
  }

  // ── MedicationRequest ─────────────────────────────────────────────────────
  private toFhirMedicationRequest(rx: any, med: any) {
    return {
      resourceType: 'MedicationRequest',
      id: `${rx.id}-${med.name?.replace(/\s+/g,'-').toLowerCase()}`,
      status: rx.isActive ? 'active' : 'completed',
      intent: 'order',
      medicationCodeableConcept: { text: `${med.name} ${med.strength || ''}`.trim() },
      subject: { reference: `Patient/${rx.patientId}` },
      authoredOn: rx.createdAt,
      requester: rx.doctor ? { display: `Dr. ${rx.doctor.user?.firstName} ${rx.doctor.user?.lastName || ''}` } : undefined,
      dosageInstruction: [{
        text: `${med.dosage || ''} ${med.frequency || ''} for ${med.duration || ''}`.trim(),
        doseAndRate: med.dosage ? [{ doseQuantity: { value: parseFloat(med.dosage) || 0, unit: 'mg' } }] : undefined,
      }],
    };
  }

  async searchMedicationRequests(q: { patientId?: string; status?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)  where.tenantId  = q.tenantId;
    if (q.patientId) where.patientId = q.patientId;
    if (q.status === 'active') where.isActive = true;
    const prescriptions = await this.prisma.prescription.findMany({
      where, take: q.count || 20, orderBy: { createdAt: 'desc' },
      include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    const entries: any[] = [];
    for (const rx of prescriptions) {
      const meds: any[] = (rx.medications as any[]) || [];
      meds.forEach(med => entries.push({ resource: this.toFhirMedicationRequest(rx, med) }));
    }
    return { resourceType: 'Bundle', type: 'searchset', total: entries.length, entry: entries };
  }

  async getMedicationRequest(id: string) {
    const rxId = id.split('-')[0];
    const rx = await this.prisma.prescription.findUnique({
      where: { id: rxId },
      include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!rx) return { resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] };
    const meds: any[] = (rx.medications as any[]) || [];
    return this.toFhirMedicationRequest(rx, meds[0] || {});
  }

  // ── Condition (diagnoses from visits) ─────────────────────────────────────
  async searchConditions(q: { patientId?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)  where.tenantId  = q.tenantId;
    if (q.patientId) where.patientId = q.patientId;
    const visits = await this.prisma.visit.findMany({ where, take: q.count || 20, orderBy: { createdAt: 'desc' } });
    const conditions = visits.filter(v => v.diagnosisText).map(v => ({
      resourceType: 'Condition',
      id: `condition-${v.id}`,
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      code: { text: v.diagnosisText || '' },
      subject: { reference: `Patient/${v.patientId}` },
      recordedDate: v.createdAt,
    }));
    return { resourceType: 'Bundle', type: 'searchset', total: conditions.length, entry: conditions.map(r => ({ resource: r })) };
  }

  // ── DiagnosticReport ─────────────────────────────────────────────────────
  async searchDiagnosticReports(q: { patientId?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)  where.tenantId  = q.tenantId;
    if (q.patientId) where.patientId = q.patientId;
    where.status = { not: 'PENDING' };
    const orders = await this.prisma.labOrder.findMany({ where, take: q.count || 20, orderBy: { createdAt: 'desc' } });
    const reports = orders.map(o => ({
      resourceType: 'DiagnosticReport',
      id: o.id,
      status: o.status?.toLowerCase() === 'reported' ? 'final' : 'registered',
      code: { text: (o.tests as any[])?.map((t:any) => t.name || t).join(', ') || 'Lab Report' },
      subject: { reference: `Patient/${o.patientId}` },
      effectiveDateTime: o.reportedAt || o.createdAt,
      presentedForm: o.reportUrl ? [{ url: o.reportUrl, contentType: 'application/pdf' }] : undefined,
    }));
    return { resourceType: 'Bundle', type: 'searchset', total: reports.length, entry: reports.map(r => ({ resource: r })) };
  }

  // ── Appointment ───────────────────────────────────────────────────────────
  async searchAppointments(q: { patientId?: string; date?: string; tenantId?: string; count?: number }) {
    const where: any = {};
    if (q.tenantId)  where.tenantId  = q.tenantId;
    if (q.patientId) where.patientId = q.patientId;
    const appts = await this.prisma.appointment.findMany({ where, take: q.count || 20, orderBy: { scheduledAt: 'desc' } });
    const fhirAppts = appts.map(a => ({
      resourceType: 'Appointment',
      id: a.id,
      status: a.status?.toLowerCase() || 'booked',
      start: a.scheduledAt,
      participant: [
        { actor: { reference: `Patient/${a.patientId}` }, status: 'accepted' },
        ...(a.doctorId ? [{ actor: { reference: `Practitioner/${a.doctorId}` }, status: 'accepted' }] : []),
      ],
    }));
    return { resourceType: 'Bundle', type: 'searchset', total: fhirAppts.length, entry: fhirAppts.map(r => ({ resource: r })) };
  }

  // ── $everything (full patient bundle) ─────────────────────────────────────
  async getPatientEverything(patientId: string, tenantId?: string) {
    const [patientBundle, obsBundle, medBundle, condBundle, reportBundle, apptBundle] = await Promise.all([
      this.getPatient(patientId, tenantId),
      this.searchObservations({ patientId, count: 50 }),
      this.searchMedicationRequests({ patientId, count: 50 }),
      this.searchConditions({ patientId, count: 50 }),
      this.searchDiagnosticReports({ patientId, count: 50 }),
      this.searchAppointments({ patientId, count: 20 }),
    ]);

    const entries: any[] = [{ resource: patientBundle }];
    [obsBundle, medBundle, condBundle, reportBundle, apptBundle].forEach((bundle: any) => {
      (bundle.entry || []).forEach((e: any) => entries.push(e));
    });

    return {
      resourceType: 'Bundle',
      id: `patient-${patientId}-everything`,
      type: 'document',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };
  }
}
