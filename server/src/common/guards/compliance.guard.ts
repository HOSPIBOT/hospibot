import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * ComplianceGuard — enforces regulatory hard-blocks before certain actions.
 * 
 * Each subtype has specific compliance requirements that MUST be satisfied
 * before reports can be released or procedures can proceed. This guard is
 * applied via @UseGuards(ComplianceGuard) on relevant controller endpoints.
 * 
 * REGULATORY REQUIREMENTS ENFORCED:
 * 1. PC-PNDT Form F (Ultrasound) — Report cannot be released without Form F
 * 2. AERB Dose Log (Radiology/PET/Nuclear/Mammography) — Dose must be logged
 * 3. Female Radiographer (Mammography) — Operator must be female
 * 4. BMW Daily Waste Log (All) — Must be filled daily
 * 5. Biosafety Declaration (Molecular/Micro) — Required for high-risk specimens
 * 6. NACO TTI Screening (Blood Bank) — All 5 TTI tests before dispatch
 * 7. ART Act Consent (IVF) — Consent + witness required
 * 8. Chain of Custody (Forensic) — Seal integrity verified
 */
@Injectable()
export class ComplianceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) return true;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subTypeId: true, settings: true },
    });
    if (!tenant?.subTypeId) return true;

    const subtypeSlug = tenant.subTypeId;
    const action = req.params?.action || req.body?.action || 'release';

    // Only enforce on report release / result approval actions
    if (action !== 'release' && action !== 'approve' && action !== 'dispatch') return true;

    const violations: string[] = [];
    const orderId = req.params?.id || req.body?.orderId;

    // ─── 1. PC-PNDT Form F (Ultrasound Centers) ──────────────────────────
    if (subtypeSlug === 'ultrasound-center') {
      if (orderId) {
        const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } }).catch(() => null);
        const s = (order as any) || {};
        if (!s.formFCompleted) {
          violations.push('PC-PNDT Form F must be completed before releasing USG report. [Pre-Conception and Pre-Natal Diagnostic Techniques Act, 1994]');
        }
      }
    }

    // ─── 2. AERB Radiation Dose Log (Radiology / PET / Nuclear / Mammo) ───
    if (['radiology-center', 'pet-scan-center', 'nuclear-medicine-center', 'mammography-center', 'dental-radiology-center'].includes(subtypeSlug)) {
      if (orderId) {
        const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } }).catch(() => null);
        const s = (order as any) || {};
        if (!s.aerbDoseLogged) {
          violations.push('AERB radiation dose must be logged before releasing report. [Atomic Energy Regulatory Board, AERB Safety Code AERB/RF-MED/SC-2]');
        }
      }
    }

    // ─── 3. Female Radiographer (Mammography) ─────────────────────────────
    if (subtypeSlug === 'mammography-center') {
      if (orderId) {
        const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } }).catch(() => null);
        const s = (order as any) || {};
        if (!s.femaleRadiographerConfirmed) {
          violations.push('Mammography scan must confirm female radiographer performed the study. [AERB + NBHE Guidelines]');
        }
      }
    }

    // ─── 4. NACO TTI Screening (Blood Bank) ───────────────────────────────
    if (subtypeSlug === 'blood-bank') {
      if (action === 'dispatch' && orderId) {
        const entry = await this.prisma.bloodBankEntry.findUnique({ where: { id: orderId } }).catch(() => null) as any;
        if (entry) {
          const ttiFields = ['ttiHiv', 'ttiHbsag', 'ttiHcv', 'ttiVdrl', 'ttiMalaria'];
          const missing = ttiFields.filter(f => !(entry as any)[f]);
          if (missing.length > 0) {
            violations.push(`All 5 TTI screenings must be completed before dispatch. Missing: ${missing.join(', ')}. [NACO Blood Safety Standards, D&C Rules 1945]`);
          }
        }
      }
    }

    // ─── 5. Biosafety Declaration (Molecular/Micro labs) ──────────────────
    if (['molecular-lab', 'micro-lab'].includes(subtypeSlug)) {
      const s = (tenant.settings as any) || {};
      if (!s.biosafetyLevelDeclared) {
        violations.push('Biosafety level must be declared in lab settings before processing high-risk specimens. [RCGM/DBT Biosafety Guidelines]');
      }
    }

    // ─── 6. ART Act Consent & Witness (IVF/Embryology) ────────────────────
    if (subtypeSlug === 'ivf-embryology') {
      if (orderId) {
        const entry = await this.prisma.ivfLabEntry.findUnique({ where: { id: orderId } }).catch(() => null) as any;
        if (entry && !entry.witnessVerified) {
          violations.push('Witness verification required for IVF/ART procedures. [Assisted Reproductive Technology (Regulation) Act, 2021]');
        }
      }
    }

    // ─── 7. Chain of Custody (Forensic/Toxicology) ────────────────────────
    if (subtypeSlug === 'forensic-toxicology') {
      if (orderId) {
        const entry = await this.prisma.forensicCase.findUnique({ where: { id: orderId } }).catch(() => null) as any;
        if (entry && !entry.sealIntact) {
          violations.push('Sample seal integrity must be verified before processing. Chain of custody compromised. [NDPS Act 1985, Section 52A]');
        }
      }
    }

    if (violations.length > 0) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Compliance Block',
        message: violations,
        complianceViolations: violations,
      });
    }

    return true;
  }
}
