import {
  Injectable, Logger, NotFoundException,
  ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ── Generate HospiBot Health ID ────────────────────────────────────────────

  private generateHealthId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'HB-';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  // ── Get or create Universal Health Record ──────────────────────────────────

  async getOrCreateUHR(mobileNumber: string, demographics?: {
    firstName?: string; lastName?: string;
    dateOfBirth?: Date; gender?: string; bloodGroup?: string;
    allergies?: string[]; chronicConditions?: string[];
  }): Promise<{ uhr: any; isNew: boolean }> {
    // Normalize mobile number
    const normalized = mobileNumber.replace(/\D/g, '').slice(-10);
    const fullNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${normalized}`;

    const existing = await this.prisma.universalHealthRecord.findFirst({
      where: {
        OR: [
          { mobileNumber: fullNumber },
          { mobileNumber: normalized },
          { mobileNumber: mobileNumber },
        ],
      },
    });

    if (existing) return { uhr: existing, isNew: false };

    // Generate unique health ID
    let healthId = this.generateHealthId();
    while (await this.prisma.universalHealthRecord.findUnique({ where: { hospibot_health_id: healthId } })) {
      healthId = this.generateHealthId();
    }

    const uhr = await this.prisma.universalHealthRecord.create({
      data: {
        mobileNumber: fullNumber,
        hospibot_health_id: healthId,
        firstName: demographics?.firstName || 'Patient',
        lastName: demographics?.lastName,
        dateOfBirth: demographics?.dateOfBirth,
        gender: demographics?.gender,
        bloodGroup: demographics?.bloodGroup,
        allergies: demographics?.allergies || [],
        chronicConditions: demographics?.chronicConditions || [],
      },
    });

    this.logger.log(`New UHR created: ${healthId} for ${fullNumber}`);
    return { uhr, isNew: true };
  }

  // ── Link patient record to UHR ─────────────────────────────────────────────

  async linkPatientToVault(tenantId: string, patientId: string): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
    });
    if (!patient) return;

    const { uhr, isNew } = await this.getOrCreateUHR(patient.phone, {
      firstName: patient.firstName,
      lastName: patient.lastName || undefined,
      dateOfBirth: patient.dateOfBirth || undefined,
      gender: patient.gender || undefined,
      bloodGroup: patient.bloodGroup || undefined,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
    });

    // Update patient with their vault ID
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { healthId: uhr.hospibot_health_id },
    }).catch(() => {});

    if (isNew) {
      // Send welcome WhatsApp message with Health ID
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
      await this.whatsappService.sendTextMessage(tenantId, patient.phone,
        `Welcome to HospiBot! 🏥\n\nYour Universal Health ID is: *${uhr.hospibot_health_id}*\n\nYour health records from ${tenant?.name || 'this facility'} will be securely stored in your Health Vault.\n\nSave this ID — you can use it at any HospiBot-connected hospital.\n\nMessage us anytime to access your records, reports, or prescriptions.`
      ).catch(() => {});
    }
  }

  // ── Add health record to vault ─────────────────────────────────────────────

  async addHealthRecord(params: {
    uhrId: string;
    tenantId: string;
    tenantName: string;
    recordType: 'VISIT' | 'LAB' | 'PRESCRIPTION' | 'IMAGING' | 'VITALS' | 'VACCINATION' | 'DISCHARGE';
    title: string;
    data: Record<string, any>;
    attachments?: string[];
    doctorName?: string;
    notes?: string;
    recordDate?: Date;
  }): Promise<any> {
    return this.prisma.healthRecord.create({
      data: {
        uhrId: params.uhrId,
        tenantId: params.tenantId,
        tenantName: params.tenantName,
        recordType: params.recordType,
        title: params.title,
        data: params.data,
        attachments: params.attachments || [],
        doctorName: params.doctorName,
        notes: params.notes,
        recordDate: params.recordDate || new Date(),
      },
    });
  }

  // ── Request access (tenant wants to see patient's records) ─────────────────

  async requestAccess(params: {
    requestingTenantId: string;
    requestingTenantName: string;
    mobileNumber: string;
    staffName?: string;
  }): Promise<{ status: string; message: string; uhrId?: string }> {
    const uhr = await this.findUhrByPhone(params.mobileNumber);
    if (!uhr) {
      return { status: 'NOT_FOUND', message: 'No Universal Health Record found for this number. Patient will be registered as new.' };
    }

    // Check if already granted
    const existing = await this.prisma.consentGrant.findUnique({
      where: { uhrId_requestingTenantId: { uhrId: uhr.id, requestingTenantId: params.requestingTenantId } },
    });

    if (existing?.status === 'GRANTED' && (!existing.expiresAt || existing.expiresAt > new Date())) {
      return { status: 'ALREADY_GRANTED', message: 'Access already granted', uhrId: uhr.id };
    }

    // Create or update consent grant request
    const grant = await this.prisma.consentGrant.upsert({
      where: { uhrId_requestingTenantId: { uhrId: uhr.id, requestingTenantId: params.requestingTenantId } },
      create: {
        uhrId: uhr.id,
        requestingTenantId: params.requestingTenantId,
        requestingTenantName: params.requestingTenantName,
        status: 'PENDING',
        scope: 'full',
      },
      update: { status: 'PENDING', requestedAt: new Date() },
    });

    // Log the request
    await this.auditLog({ uhrId: uhr.id, consentGrantId: grant.id, action: 'REQUESTED', actorType: 'TENANT_STAFF', tenantId: params.requestingTenantId });

    // Send WhatsApp consent request to patient
    const consentMsg = `🏥 *Health Record Access Request*\n\n*${params.requestingTenantName}* is requesting access to your health records.\n\nWhat would you like to share?\n\n1️⃣ Share Full History\n2️⃣ Share Last 1 Year Only\n3️⃣ Share Lab Reports Only\n4️⃣ Deny Access\n\nReply with the number. This request expires in 24 hours.\n\n_Your Health ID: ${uhr.hospibot_health_id}_`;

    await this.whatsappService.sendTextMessage(
      params.requestingTenantId,
      uhr.mobileNumber,
      consentMsg,
    ).catch(() => {});

    return { status: 'PENDING', message: 'Consent request sent to patient via WhatsApp', uhrId: uhr.id };
  }

  // ── Handle patient consent response ───────────────────────────────────────

  async handleConsentResponse(params: {
    mobileNumber: string;
    response: '1' | '2' | '3' | '4' | 'FULL' | 'YEAR' | 'LAB' | 'DENY';
    tenantId?: string;
  }): Promise<void> {
    const uhr = await this.findUhrByPhone(params.mobileNumber);
    if (!uhr) return;

    // Find pending consent grant (most recent)
    const grants = await this.prisma.consentGrant.findMany({
      where: { uhrId: uhr.id, status: 'PENDING' },
      orderBy: { requestedAt: 'desc' },
    });

    if (grants.length === 0) return;

    const grant = grants[0];

    const scopeMap: Record<string, string> = {
      '1': 'full', 'FULL': 'full',
      '2': 'last_year', 'YEAR': 'last_year',
      '3': 'lab_only', 'LAB': 'lab_only',
      '4': 'denied', 'DENY': 'denied',
    };

    const scope = scopeMap[params.response.toUpperCase()] || 'denied';
    const denied = scope === 'denied';

    await this.prisma.consentGrant.update({
      where: { id: grant.id },
      data: {
        status: denied ? 'DENIED' : 'GRANTED',
        scope,
        grantedAt: denied ? undefined : new Date(),
        expiresAt: denied ? undefined : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    await this.auditLog({
      uhrId: uhr.id, consentGrantId: grant.id,
      action: denied ? 'DENIED' : 'GRANTED',
      actorType: 'PATIENT', scope,
    });

    // Confirm to patient
    const confirmMsg = denied
      ? `✅ Access denied. ${grant.requestingTenantName} will not be able to see your health records.`
      : `✅ Access granted!\n\n*${grant.requestingTenantName}* can now view your ${scope === 'full' ? 'complete health history' : scope === 'last_year' ? 'records from the last year' : 'lab reports'}.\n\nYou can revoke access anytime by messaging: *Revoke access for ${grant.requestingTenantName}*`;

    await this.whatsappService.sendTextMessage(
      grant.requestingTenantId,
      uhr.mobileNumber,
      confirmMsg,
    ).catch(() => {});
  }

  // ── Get patient records for a tenant (respects consent) ───────────────────

  async getRecordsForTenant(params: {
    uhrId: string;
    requestingTenantId: string;
    includeAllTenants?: boolean;
  }): Promise<{ uhr: any; records: any[]; consentScope: string }> {
    const uhr = await this.prisma.universalHealthRecord.findUnique({
      where: { id: params.uhrId },
      include: {
        dependents: { include: { dependentAccount: true } },
        asDependents: { include: { primaryAccount: true } },
      },
    });
    if (!uhr) throw new NotFoundException('Health record not found');

    // Check consent
    const grant = await this.prisma.consentGrant.findUnique({
      where: { uhrId_requestingTenantId: { uhrId: params.uhrId, requestingTenantId: params.requestingTenantId } },
    });

    const hasConsent = grant?.status === 'GRANTED' && (!grant.expiresAt || grant.expiresAt > new Date());
    const scope = hasConsent ? grant.scope : 'own_only';

    // Build record query based on consent scope
    const where: any = { uhrId: params.uhrId };

    if (!hasConsent) {
      // Only own tenant's records without consent
      where.tenantId = params.requestingTenantId;
    } else if (scope === 'lab_only') {
      where.recordType = 'LAB';
    } else if (scope === 'last_year') {
      where.recordDate = { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
    }
    // scope === 'full' — no additional filter, all records

    const records = await this.prisma.healthRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    });

    // Log access
    await this.auditLog({
      uhrId: params.uhrId,
      action: hasConsent ? 'GRANTED' : 'OWN_RECORDS_ACCESSED',
      actorType: 'TENANT_STAFF',
      tenantId: params.requestingTenantId,
      scope,
    });

    return { uhr, records, consentScope: scope };
  }

  // ── Emergency access (critical data only) ─────────────────────────────────

  async emergencyAccess(params: {
    mobileNumber: string;
    requestingTenantId: string;
    staffId: string;
    reason: string;
  }): Promise<{ criticalData: any; uhrId: string }> {
    const uhr = await this.findUhrByPhone(params.mobileNumber);
    if (!uhr) throw new NotFoundException('No health record found for this number');

    // Log emergency access — immutable
    await this.auditLog({
      uhrId: uhr.id,
      action: 'EMERGENCY_ACCESS',
      actorType: 'EMERGENCY',
      actorId: params.staffId,
      tenantId: params.requestingTenantId,
      reason: params.reason,
      scope: 'emergency',
    });

    // Return ONLY critical data — no full history
    return {
      uhrId: uhr.id,
      criticalData: {
        name: `${uhr.firstName} ${uhr.lastName || ''}`.trim(),
        bloodGroup: uhr.bloodGroup,
        allergies: uhr.allergies,
        chronicConditions: uhr.chronicConditions,
        currentMedications: uhr.currentMedications,
        emergencyContact: uhr.emergencyContact,
        healthId: uhr.hospibot_health_id,
      },
    };
  }

  // ── Revoke consent ─────────────────────────────────────────────────────────

  async revokeConsent(params: {
    mobileNumber: string;
    tenantName: string;
  }): Promise<{ revoked: boolean; tenantName?: string }> {
    const uhr = await this.findUhrByPhone(params.mobileNumber);
    if (!uhr) return { revoked: false };

    // Find by tenant name (patient says "Revoke access for Apollo Clinic")
    const grant = await this.prisma.consentGrant.findFirst({
      where: {
        uhrId: uhr.id,
        status: 'GRANTED',
        requestingTenantName: { contains: params.tenantName, mode: 'insensitive' },
      },
    });

    if (!grant) return { revoked: false };

    await this.prisma.consentGrant.update({
      where: { id: grant.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await this.auditLog({ uhrId: uhr.id, consentGrantId: grant.id, action: 'REVOKED', actorType: 'PATIENT' });

    return { revoked: true, tenantName: grant.requestingTenantName || params.tenantName };
  }

  // ── Patient self-access via WhatsApp ───────────────────────────────────────

  async handleSelfAccessCommand(params: {
    tenantId: string;
    mobileNumber: string;
    command: string;
  }): Promise<string> {
    const { command } = params;
    const uhr = await this.findUhrByPhone(params.mobileNumber);
    if (!uhr) return '';

    const cmd = command.toLowerCase().trim();

    // "Show my records" / "my history"
    if (/my records|health records|medical history|show my|my history/.test(cmd)) {
      const records = await this.prisma.healthRecord.findMany({
        where: { uhrId: uhr.id },
        orderBy: { recordDate: 'desc' },
        take: 20,
      });

      const byType = records.reduce((acc: any, r) => {
        acc[r.recordType] = (acc[r.recordType] || 0) + 1;
        return acc;
      }, {});

      const summary = Object.entries(byType).map(([type, count]) =>
        `• ${count} ${type.toLowerCase().replace('_', ' ')} record${(count as number) > 1 ? 's' : ''}`
      ).join('\n');

      return `📋 *Your Health Summary*\nHealth ID: *${uhr.hospibot_health_id}*\n\n${summary || 'No records yet'}\n\nReply:\n1️⃣ Download Lab Reports\n2️⃣ View Prescriptions\n3️⃣ Who has access to my records`;
    }

    // "Download my reports" / "lab reports"
    if (/lab report|download report|my report|test result/.test(cmd)) {
      const labs = await this.prisma.healthRecord.findMany({
        where: { uhrId: uhr.id, recordType: 'LAB' },
        orderBy: { recordDate: 'desc' },
        take: 5,
      });

      if (labs.length === 0) return `No lab reports found in your Health Vault yet.`;

      const list = labs.map((l, i) =>
        `${i + 1}. ${l.title} — ${new Date(l.recordDate).toLocaleDateString('en-IN')} (${l.tenantName || 'Unknown'})`
      ).join('\n');

      return `📄 *Your Lab Reports*\n\n${list}\n\nReply with the number to download.`;
    }

    // "What medicines am I taking" / "my medicines"
    if (/medicine|medication|tablet|prescription|what am i taking/.test(cmd)) {
      const rxRecords = await this.prisma.healthRecord.findMany({
        where: { uhrId: uhr.id, recordType: 'PRESCRIPTION' },
        orderBy: { recordDate: 'desc' },
        take: 3,
      });

      if (rxRecords.length === 0) return `No prescription records found in your Health Vault.`;

      const meds = rxRecords.flatMap(r => (r.data as any).medications || []);
      if (meds.length === 0) return `No medication details found.`;

      const medList = meds.slice(0, 8).map((m: any) =>
        `💊 ${m.name} — ${m.dosage || ''} ${m.frequency || ''}`
      ).join('\n');

      return `💊 *Your Current Medications*\n\n${medList}\n\n_From your recent prescriptions. Always follow your doctor's advice._`;
    }

    // "Who has access" / "my access"
    if (/who has access|access to my|my access|who can see/.test(cmd)) {
      const grants = await this.prisma.consentGrant.findMany({
        where: { uhrId: uhr.id, status: 'GRANTED' },
      });

      if (grants.length === 0) return `No hospitals currently have access to your health records beyond your visit history.\n\nYour records are private and secure. 🔒`;

      const list = grants.map(g =>
        `🏥 ${g.requestingTenantName}\n   Scope: ${g.scope} • Expires: ${g.expiresAt ? new Date(g.expiresAt).toLocaleDateString('en-IN') : 'Never'}`
      ).join('\n\n');

      return `🔐 *Hospitals with Access to Your Records*\n\n${list}\n\nTo revoke access, reply: *Revoke access for [hospital name]*`;
    }

    // "Revoke access"
    const revokeMatch = cmd.match(/revoke access for (.+)/i);
    if (revokeMatch) {
      const tenantName = revokeMatch[1].trim();
      const result = await this.revokeConsent({ mobileNumber: params.mobileNumber, tenantName });
      if (result.revoked) {
        return `✅ Access for *${result.tenantName}* has been revoked. They can no longer view your health records.`;
      }
      return `No active access found for "${tenantName}". Check the hospital name and try again.`;
    }

    return '';
  }

  // ── Add dependent ──────────────────────────────────────────────────────────

  async addDependent(params: {
    primaryMobile: string;
    dependentMobile: string;
    relationship: 'CHILD' | 'PARENT' | 'SPOUSE' | 'SIBLING' | 'OTHER';
    dependentName?: string;
  }): Promise<{ dependent: any }> {
    const primaryUhr = await this.findUhrByPhone(params.primaryMobile);
    if (!primaryUhr) throw new NotFoundException('Primary account not found');

    const { uhr: dependentUhr } = await this.getOrCreateUHR(params.dependentMobile, {
      firstName: params.dependentName || 'Dependent',
    });

    const existing = await this.prisma.dependent.findUnique({
      where: { primaryUhrId_dependentUhrId: { primaryUhrId: primaryUhr.id, dependentUhrId: dependentUhr.id } },
    });
    if (existing) throw new ConflictException('Dependent already linked');

    const dependent = await this.prisma.dependent.create({
      data: {
        primaryUhrId: primaryUhr.id,
        dependentUhrId: dependentUhr.id,
        relationship: params.relationship,
      },
    });

    return { dependent };
  }

  // ── Lookup UHR by phone ────────────────────────────────────────────────────

  async findUhrByPhone(mobileNumber: string): Promise<any | null> {
    const normalized = mobileNumber.replace(/\D/g, '').slice(-10);
    return this.prisma.universalHealthRecord.findFirst({
      where: {
        OR: [
          { mobileNumber: mobileNumber },
          { mobileNumber: `+91${normalized}` },
          { mobileNumber: normalized },
        ],
      },
    });
  }

  // ── Cross-provider patient lookup ──────────────────────────────────────────

  async lookupByPhone(mobileNumber: string, requestingTenantId: string): Promise<{
    found: boolean;
    uhr?: any;
    summary?: any;
    consentStatus?: string;
  }> {
    const uhr = await this.findUhrByPhone(mobileNumber);
    if (!uhr) return { found: false };

    const grant = await this.prisma.consentGrant.findUnique({
      where: { uhrId_requestingTenantId: { uhrId: uhr.id, requestingTenantId } },
    });

    const consentStatus = grant?.status || 'NONE';

    // Return summary only (not full records) without consent
    return {
      found: true,
      uhr: {
        id: uhr.id,
        hospibot_health_id: uhr.hospibot_health_id,
        firstName: uhr.firstName,
        lastName: uhr.lastName,
        bloodGroup: uhr.bloodGroup,
        allergies: uhr.allergies,
        chronicConditions: uhr.chronicConditions,
      },
      consentStatus,
    };
  }

  // ── Audit log helper ───────────────────────────────────────────────────────

  private async auditLog(params: {
    uhrId: string;
    consentGrantId?: string;
    action: string;
    actorType: string;
    actorId?: string;
    tenantId?: string;
    scope?: string;
    reason?: string;
  }) {
    await this.prisma.consentAuditLog.create({
      data: {
        uhrId: params.uhrId,
        consentGrantId: params.consentGrantId,
        action: params.action,
        actorType: params.actorType,
        actorId: params.actorId,
        tenantId: params.tenantId,
        scope: params.scope,
        reason: params.reason,
      },
    }).catch(() => {});
  }

  // ── Stats for tenant ───────────────────────────────────────────────────────

  async getVaultStats(tenantId: string): Promise<any> {
    const [recordsCreated, activeConsents, emergencyAccesses] = await Promise.all([
      this.prisma.healthRecord.count({ where: { tenantId } }),
      this.prisma.consentGrant.count({ where: { requestingTenantId: tenantId, status: 'GRANTED' } }),
      this.prisma.consentAuditLog.count({ where: { tenantId, action: 'EMERGENCY_ACCESS' } }),
    ]);

    return { recordsCreated, activeConsents, emergencyAccesses };
  }
}
