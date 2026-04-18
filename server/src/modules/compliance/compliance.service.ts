/**
 * Compliance Service — Sprint 3 Regulatory Hard-Blocks
 *
 * Enforces Indian regulatory compliance for diagnostic operations.
 * Surface areas:
 *   - PC-PNDT Act, 1994                  (prenatal imaging Form F)
 *   - AERB Radiation Protection Rules    (X-ray / CT / Mammo / Nuclear Medicine)
 *   - PC-PNDT sex-determination safeguards (pregnancy screening)
 *   - AERB Mammography Guidelines         (operator certification + daily QC)
 *   - Bio-Medical Waste Management Rules 2016 (daily segregation logs)
 *   - ICMR BSL-2 Biosafety Guidelines     (weekly checklist)
 *
 * The guard methods (assert*) throw HttpException on violation. They are
 * called from DiagnosticService.signAndRelease before a report is released
 * to the patient — creating a HARD BLOCK rather than a soft warning.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Compliance guard configuration knobs
const BMW_LOG_MAX_AGE_HOURS = 24;            // BMW log must exist within last 24h
const BIOSAFETY_MAX_AGE_DAYS = 7;            // Most recent biosafety checklist within 7 days
const BIOSAFETY_MUST_BE_PASSED = true;       // Most recent one must have passed=true
const MAMMO_QC_MAX_AGE_HOURS = 24;           // Operator QC within last 24h for mammo
const AERB_CERT_GRACE_DAYS = 0;              // No grace period for expired certification

// Test flags — any of these codes/categories trigger the matching compliance guard.
// Tenants can override via tests.code metadata; these are the defaults.
const PRENATAL_IMAGING_CODES = ['USG_OBS', 'FETAL_MRI', 'NT_SCAN', 'ANOMALY_SCAN'];
const RADIATION_EXAM_TYPES = ['XRAY', 'CT', 'MAMMO', 'FLUORO', 'NUCLEAR_MEDICINE'];
const MAMMO_EXAM_TYPES = ['MAMMO'];

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────
  // GUARD ORCHESTRATOR — called by DiagnosticService.signAndRelease
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Master guard. Runs every applicable compliance check for this lab order.
   * Throws ForbiddenException with human-readable message on the first failure
   * so the operator knows exactly what to fix. Never swallows errors — release
   * MUST be blocked if any surface fails.
   */
  async assertCanReleaseReport(tenantId: string, labOrderId: string): Promise<void> {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: labOrderId, tenantId },
      include: {
        orderItems: true,
      },
    });
    if (!order) throw new NotFoundException('Lab order not found for compliance check');

    // Always-on guards (any diagnostic operation requires these)
    await this.assertBmwLogCurrent(tenantId, (order as any).branchId ?? null);
    await this.assertBiosafetyPassed(tenantId, (order as any).branchId ?? null);

    // Determine which conditional guards apply based on order contents
    const testCodes = this.extractTestCodes(order);
    const examTypes = this.inferExamTypes(testCodes);

    const isPrenatal = testCodes.some((c) => PRENATAL_IMAGING_CODES.includes(c));
    const hasRadiation = examTypes.some((t) => RADIATION_EXAM_TYPES.includes(t));
    const hasMammo = examTypes.some((t) => MAMMO_EXAM_TYPES.includes(t));

    if (isPrenatal) {
      await this.assertPcpndtFormFSubmitted(tenantId, labOrderId);
      await this.assertPregnancyScreeningDone(tenantId, labOrderId);
    }
    if (hasRadiation) {
      await this.assertAerbDoseEntryRecorded(tenantId, labOrderId);
    }
    if (hasMammo) {
      await this.assertMammoOperatorQcCurrent(tenantId, labOrderId);
    }

    this.logger.log(`✅ Compliance passed for order ${labOrderId}`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // INDIVIDUAL GUARDS — each throws ForbiddenException on failure
  // ────────────────────────────────────────────────────────────────────────

  /**
   * BMW daily log must exist for this tenant (and branch, if given) within
   * the last 24 hours. Prevents releasing reports when waste segregation
   * hasn't been logged — a direct BMW Rules 2016 violation.
   */
  async assertBmwLogCurrent(tenantId: string, branchId: string | null): Promise<void> {
    const threshold = new Date(Date.now() - BMW_LOG_MAX_AGE_HOURS * 3600_000);
    const log = await this.prisma.bmwWasteLog.findFirst({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        logDate: { gte: threshold },
      },
      orderBy: { logDate: 'desc' },
    });
    if (!log) {
      throw new ForbiddenException(
        `Bio-medical waste log missing: a BMW segregation log must be filed within the last ${BMW_LOG_MAX_AGE_HOURS} hours before any report can be released. Please record today's yellow/red/white/blue bag weights and authorized-disposer receipt number.`,
      );
    }
  }

  /**
   * Most recent biosafety checklist for this tenant/branch must be within
   * the last 7 days AND must have passed (every BSL-2 item checked off).
   */
  async assertBiosafetyPassed(tenantId: string, branchId: string | null): Promise<void> {
    const threshold = new Date(Date.now() - BIOSAFETY_MAX_AGE_DAYS * 86400_000);
    const mostRecent = await this.prisma.biosafetyChecklist.findFirst({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        checklistDate: { gte: threshold },
      },
      orderBy: { checklistDate: 'desc' },
    });
    if (!mostRecent) {
      throw new ForbiddenException(
        `Biosafety checklist missing: a BSL-2 compliance checklist must be filed within the last ${BIOSAFETY_MAX_AGE_DAYS} days before any report can be released. Please complete the weekly checklist (BSC-II certification, PPE, spill kits, eyewash, autoclave spore test, training log).`,
      );
    }
    if (BIOSAFETY_MUST_BE_PASSED && !mostRecent.passed) {
      throw new ForbiddenException(
        `Biosafety checklist failed: the most recent checklist (dated ${mostRecent.checklistDate.toISOString().slice(0, 10)}) did not pass all BSL-2 items. Resolve the failing items and file a passing checklist before releasing reports.`,
      );
    }
  }

  /**
   * For prenatal imaging orders, a completed Form F (PC-PNDT Act) must be
   * linked to this lab order before release.
   */
  async assertPcpndtFormFSubmitted(tenantId: string, labOrderId: string): Promise<void> {
    const form = await this.prisma.pcpndtFormF.findFirst({
      where: { tenantId, labOrderId, informedConsentTaken: true },
    });
    if (!form) {
      throw new ForbiddenException(
        `PC-PNDT Form F missing: prenatal imaging orders require a completed Form F with informed consent, referring-doctor registration number, and performing-doctor registration number before the report can be released.`,
      );
    }
  }

  /**
   * Prenatal orders also require a pregnancy screening record to confirm
   * the patient signed the non-sex-determination declaration.
   */
  async assertPregnancyScreeningDone(tenantId: string, labOrderId: string): Promise<void> {
    const screen = await this.prisma.pregnancyScreening.findFirst({
      where: { tenantId, labOrderId, sexDeterminationDeclarationSigned: true },
    });
    if (!screen) {
      throw new ForbiddenException(
        `Pregnancy screening missing: the PC-PNDT non-sex-determination declaration must be signed by the patient before releasing a prenatal imaging report.`,
      );
    }
    if (screen.flaggedForReview) {
      throw new ForbiddenException(
        `Pregnancy screening flagged for review: this order has been marked for clinical review. Resolve the flag before releasing the report.`,
      );
    }
  }

  /**
   * Any order involving radiation must have an AERB dose entry logged against it.
   */
  async assertAerbDoseEntryRecorded(tenantId: string, labOrderId: string): Promise<void> {
    const entry = await this.prisma.aerbDoseEntry.findFirst({
      where: { tenantId, labOrderId },
    });
    if (!entry) {
      throw new ForbiddenException(
        `AERB dose entry missing: radiation-bearing procedures require a dose log (patient dose in mSv + operator TLD badge reading) before the report can be released.`,
      );
    }
  }

  /**
   * Mammography requires a valid, non-expired operator certification AND a
   * passing daily QC (phantom scan) within the last 24h.
   */
  async assertMammoOperatorQcCurrent(tenantId: string, labOrderId: string): Promise<void> {
    // Find the AERB entry we just asserted for this order (mammo is radiation)
    const doseEntry = await this.prisma.aerbDoseEntry.findFirst({
      where: { tenantId, labOrderId, examType: 'MAMMO' },
      orderBy: { examDate: 'desc' },
    });
    if (!doseEntry) return; // Not a mammo order after all; defer to AERB guard.

    const qcThreshold = new Date(Date.now() - MAMMO_QC_MAX_AGE_HOURS * 3600_000);
    const now = new Date();
    const opLog = await this.prisma.mammographyOperatorLog.findFirst({
      where: {
        tenantId,
        operatorUserId: doseEntry.operatorUserId,
        dailyQcDate: { gte: qcThreshold },
        dailyQcPassed: true,
        certificationExpiresAt: { gt: new Date(now.getTime() - AERB_CERT_GRACE_DAYS * 86400_000) },
      },
      orderBy: { dailyQcDate: 'desc' },
    });
    if (!opLog) {
      throw new ForbiddenException(
        `Mammography operator QC invalid: operator certification must be non-expired AND a passing phantom-image daily QC must be on file within the last ${MAMMO_QC_MAX_AGE_HOURS} hours before a mammography report can be released.`,
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // HELPERS — extract order metadata for conditional guard routing
  // ────────────────────────────────────────────────────────────────────────

  private extractTestCodes(order: any): string[] {
    const fromItems: string[] = (order.orderItems ?? [])
      .map((i: any) => (i.testCode ?? null) as string | null)
      .filter((x: string | null): x is string => !!x);
    const fromTests: string[] = Array.isArray(order.tests)
      ? order.tests
          .map((t: any) => (typeof t === 'string' ? t : t?.code ?? null) as string | null)
          .filter((x: string | null): x is string => !!x)
      : [];
    return [...new Set<string>([...fromItems, ...fromTests])];
  }

  /**
   * Infer AERB exam-type flags from test codes by prefix matching. Tenants
   * seed their test catalogs with standardized prefixes (XRAY_, CT_, MAMMO_,
   * FLUORO_, NUCL_) — these are converted to canonical exam types here.
   * Prenatal USG codes (USG_OBS, FETAL_MRI, etc.) are handled separately via
   * PRENATAL_IMAGING_CODES and don't flow through this function.
   */
  private inferExamTypes(testCodes: string[]): string[] {
    const types = new Set<string>();
    for (const code of testCodes) {
      const upper = code.toUpperCase();
      if (upper.startsWith('MAMMO'))        types.add('MAMMO');
      else if (upper.startsWith('CT_') || upper === 'CT') types.add('CT');
      else if (upper.startsWith('XRAY'))    types.add('XRAY');
      else if (upper.startsWith('FLUORO'))  types.add('FLUORO');
      else if (upper.startsWith('NUCL') || upper.startsWith('PET')) types.add('NUCLEAR_MEDICINE');
    }
    return [...types];
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — PC-PNDT Form F
  // ────────────────────────────────────────────────────────────────────────

  async listFormF(tenantId: string, opts?: { labOrderId?: string; submitted?: boolean }) {
    return this.prisma.pcpndtFormF.findMany({
      where: {
        tenantId,
        ...(opts?.labOrderId ? { labOrderId: opts.labOrderId } : {}),
        ...(opts?.submitted !== undefined ? { submittedToAuthority: opts.submitted } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createFormF(tenantId: string, dto: any) {
    this.requireFields(dto, [
      'formFNumber', 'patientId', 'referringDoctorName', 'referringDoctorRegNo',
      'performedByDoctorName', 'performedByDoctorRegNo', 'indicationForScan', 'scanType',
    ]);
    return this.prisma.pcpndtFormF.create({
      data: {
        tenantId,
        formFNumber: dto.formFNumber,
        labOrderId: dto.labOrderId ?? null,
        patientId: dto.patientId,
        referringDoctorName: dto.referringDoctorName,
        referringDoctorRegNo: dto.referringDoctorRegNo,
        performedByDoctorName: dto.performedByDoctorName,
        performedByDoctorRegNo: dto.performedByDoctorRegNo,
        gestationalAgeWeeks: dto.gestationalAgeWeeks ?? null,
        indicationForScan: dto.indicationForScan,
        scanType: dto.scanType,
        findings: dto.findings ?? null,
        informedConsentTaken: !!dto.informedConsentTaken,
      },
    });
  }

  async markFormFSubmitted(tenantId: string, id: string) {
    const row = await this.prisma.pcpndtFormF.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Form F not found');
    return this.prisma.pcpndtFormF.update({
      where: { id },
      data: { submittedToAuthority: true, submittedAt: new Date() },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — AERB dose entries
  // ────────────────────────────────────────────────────────────────────────

  async listAerbDoseEntries(tenantId: string, opts?: { labOrderId?: string; operatorUserId?: string; from?: string; to?: string }) {
    return this.prisma.aerbDoseEntry.findMany({
      where: {
        tenantId,
        ...(opts?.labOrderId ? { labOrderId: opts.labOrderId } : {}),
        ...(opts?.operatorUserId ? { operatorUserId: opts.operatorUserId } : {}),
        ...(opts?.from || opts?.to
          ? { examDate: { ...(opts?.from ? { gte: new Date(opts.from) } : {}), ...(opts?.to ? { lte: new Date(opts.to) } : {}) } }
          : {}),
      },
      orderBy: { examDate: 'desc' },
      take: 200,
    });
  }

  async createAerbDoseEntry(tenantId: string, dto: any) {
    this.requireFields(dto, ['examType', 'doseMSv', 'operatorUserId', 'examDate']);
    return this.prisma.aerbDoseEntry.create({
      data: {
        tenantId,
        labOrderId: dto.labOrderId ?? null,
        patientId: dto.patientId ?? null,
        equipmentId: dto.equipmentId ?? null,
        examDate: new Date(dto.examDate),
        examType: String(dto.examType).toUpperCase(),
        doseMSv: Number(dto.doseMSv),
        operatorUserId: dto.operatorUserId,
        operatorTldBadgeReading: dto.operatorTldBadgeReading != null ? Number(dto.operatorTldBadgeReading) : null,
        notes: dto.notes ?? null,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — Pregnancy screenings
  // ────────────────────────────────────────────────────────────────────────

  async listPregnancyScreenings(tenantId: string, opts?: { labOrderId?: string; flagged?: boolean }) {
    return this.prisma.pregnancyScreening.findMany({
      where: {
        tenantId,
        ...(opts?.labOrderId ? { labOrderId: opts.labOrderId } : {}),
        ...(opts?.flagged !== undefined ? { flaggedForReview: opts.flagged } : {}),
      },
      orderBy: { screenedAt: 'desc' },
      take: 200,
    });
  }

  async createPregnancyScreening(tenantId: string, dto: any) {
    this.requireFields(dto, ['patientId', 'screenedByUserId']);
    return this.prisma.pregnancyScreening.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        labOrderId: dto.labOrderId ?? null,
        gestationalAgeWeeks: dto.gestationalAgeWeeks ?? null,
        hasConsentForm: !!dto.hasConsentForm,
        sexDeterminationDeclarationSigned: !!dto.sexDeterminationDeclarationSigned,
        flaggedForReview: !!dto.flaggedForReview,
        screenedByUserId: dto.screenedByUserId,
        notes: dto.notes ?? null,
      },
    });
  }

  async updatePregnancyScreening(tenantId: string, id: string, patch: any) {
    const row = await this.prisma.pregnancyScreening.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Screening not found');
    return this.prisma.pregnancyScreening.update({
      where: { id },
      data: {
        ...(patch.hasConsentForm !== undefined ? { hasConsentForm: !!patch.hasConsentForm } : {}),
        ...(patch.sexDeterminationDeclarationSigned !== undefined
          ? { sexDeterminationDeclarationSigned: !!patch.sexDeterminationDeclarationSigned }
          : {}),
        ...(patch.flaggedForReview !== undefined ? { flaggedForReview: !!patch.flaggedForReview } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — Mammography operator logs
  // ────────────────────────────────────────────────────────────────────────

  async listMammoOperatorLogs(tenantId: string, operatorUserId?: string) {
    return this.prisma.mammographyOperatorLog.findMany({
      where: { tenantId, ...(operatorUserId ? { operatorUserId } : {}) },
      orderBy: { dailyQcDate: 'desc' },
      take: 200,
    });
  }

  async createMammoOperatorLog(tenantId: string, dto: any) {
    this.requireFields(dto, ['operatorUserId', 'certificationNumber', 'certificationExpiresAt', 'dailyQcDate']);
    return this.prisma.mammographyOperatorLog.create({
      data: {
        tenantId,
        operatorUserId: dto.operatorUserId,
        certificationNumber: dto.certificationNumber,
        certificationExpiresAt: new Date(dto.certificationExpiresAt),
        dailyQcDate: new Date(dto.dailyQcDate),
        dailyQcPassed: !!dto.dailyQcPassed,
        phantomImageScore: dto.phantomImageScore ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — BMW waste logs
  // ────────────────────────────────────────────────────────────────────────

  async listBmwLogs(tenantId: string, opts?: { branchId?: string; from?: string; to?: string }) {
    return this.prisma.bmwWasteLog.findMany({
      where: {
        tenantId,
        ...(opts?.branchId ? { branchId: opts.branchId } : {}),
        ...(opts?.from || opts?.to
          ? { logDate: { ...(opts?.from ? { gte: new Date(opts.from) } : {}), ...(opts?.to ? { lte: new Date(opts.to) } : {}) } }
          : {}),
      },
      orderBy: { logDate: 'desc' },
      take: 200,
    });
  }

  async createBmwLog(tenantId: string, dto: any) {
    this.requireFields(dto, ['logDate', 'authorizedDisposerName', 'authorizedDisposerReceipt', 'loggedByUserId']);
    return this.prisma.bmwWasteLog.create({
      data: {
        tenantId,
        branchId: dto.branchId ?? null,
        logDate: new Date(dto.logDate),
        yellowBagKg: Number(dto.yellowBagKg ?? 0),
        redBagKg: Number(dto.redBagKg ?? 0),
        whiteBagKg: Number(dto.whiteBagKg ?? 0),
        blueBagKg: Number(dto.blueBagKg ?? 0),
        authorizedDisposerName: dto.authorizedDisposerName,
        authorizedDisposerReceipt: dto.authorizedDisposerReceipt,
        loggedByUserId: dto.loggedByUserId,
        notes: dto.notes ?? null,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // CRUD — Biosafety checklists
  // ────────────────────────────────────────────────────────────────────────

  async listBiosafetyChecklists(tenantId: string, opts?: { branchId?: string }) {
    return this.prisma.biosafetyChecklist.findMany({
      where: { tenantId, ...(opts?.branchId ? { branchId: opts.branchId } : {}) },
      orderBy: { checklistDate: 'desc' },
      take: 200,
    });
  }

  async createBiosafetyChecklist(tenantId: string, dto: any) {
    this.requireFields(dto, ['checklistDate', 'completedByUserId']);
    const items = {
      bsc2CertCurrentWithin12Mo: !!dto.bsc2CertCurrentWithin12Mo,
      ppeInventoryAdequate: !!dto.ppeInventoryAdequate,
      spillKitsAvailable: !!dto.spillKitsAvailable,
      eyewashStationFunctional: !!dto.eyewashStationFunctional,
      autoclaveSporeTestPassedWithin30D: !!dto.autoclaveSporeTestPassedWithin30D,
      trainingLogCurrent: !!dto.trainingLogCurrent,
    };
    const passed = Object.values(items).every(Boolean);
    return this.prisma.biosafetyChecklist.create({
      data: {
        tenantId,
        branchId: dto.branchId ?? null,
        checklistDate: new Date(dto.checklistDate),
        ...items,
        passed,
        notes: dto.notes ?? null,
        completedByUserId: dto.completedByUserId,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // DASHBOARD — aggregate compliance status for the tenant
  // ────────────────────────────────────────────────────────────────────────

  async getComplianceStatus(tenantId: string, branchId?: string) {
    const bmwThreshold = new Date(Date.now() - BMW_LOG_MAX_AGE_HOURS * 3600_000);
    const biosafetyThreshold = new Date(Date.now() - BIOSAFETY_MAX_AGE_DAYS * 86400_000);

    const [latestBmw, latestBiosafety, pendingFormF, flaggedScreenings] = await Promise.all([
      this.prisma.bmwWasteLog.findFirst({
        where: { tenantId, ...(branchId ? { branchId } : {}) },
        orderBy: { logDate: 'desc' },
      }),
      this.prisma.biosafetyChecklist.findFirst({
        where: { tenantId, ...(branchId ? { branchId } : {}) },
        orderBy: { checklistDate: 'desc' },
      }),
      this.prisma.pcpndtFormF.count({ where: { tenantId, submittedToAuthority: false } }),
      this.prisma.pregnancyScreening.count({ where: { tenantId, flaggedForReview: true } }),
    ]);

    return {
      bmw: {
        latestLogDate: latestBmw?.logDate ?? null,
        isCurrent: !!latestBmw && latestBmw.logDate >= bmwThreshold,
        maxAgeHours: BMW_LOG_MAX_AGE_HOURS,
      },
      biosafety: {
        latestChecklistDate: latestBiosafety?.checklistDate ?? null,
        isCurrent: !!latestBiosafety && latestBiosafety.checklistDate >= biosafetyThreshold,
        isPassing: !!latestBiosafety?.passed,
        maxAgeDays: BIOSAFETY_MAX_AGE_DAYS,
      },
      pcpndt: {
        pendingSubmissionCount: pendingFormF,
      },
      pregnancyScreenings: {
        flaggedForReviewCount: flaggedScreenings,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // INTERNAL
  // ────────────────────────────────────────────────────────────────────────

  private requireFields(dto: any, fields: string[]) {
    const missing = fields.filter((f) => dto?.[f] === undefined || dto?.[f] === null || dto?.[f] === '');
    if (missing.length) {
      throw new BadRequestException(`Missing required field(s): ${missing.join(', ')}`);
    }
  }
}
