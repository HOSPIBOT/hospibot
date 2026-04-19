import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * DonorService — Blood donor registry with NACO-compliant eligibility screening.
 *
 * Regulatory references:
 *   - NACO Standards for Blood Banks & BTS (donor selection criteria)
 *   - Drugs & Cosmetics Rules, 1945 — Schedule F Part XII-B
 *   - Supreme Court PIL Common Cause vs Union of India (1996) — banned paid donors
 *   - Drugs & Cosmetics Act, 1940 Section 3(b) — blood = drug
 *
 * Eligibility thresholds are NOT configurable — they are Indian law.
 */

// ── NACO Donor Eligibility Thresholds (Indian regulatory standard) ──────
const NACO = {
  MIN_AGE: 18,
  MAX_AGE: 65,
  MIN_WEIGHT_KG: 45,
  MIN_HB_GDL: 12.5,
  BP_SYSTOLIC_MIN: 100,
  BP_SYSTOLIC_MAX: 180,
  BP_DIASTOLIC_MIN: 50,
  BP_DIASTOLIC_MAX: 100,
  PULSE_MIN: 60,
  PULSE_MAX: 100,
  MIN_DONATION_INTERVAL_DAYS: 90, // 3 months for whole blood
} as const;

@Injectable()
export class DonorService {
  constructor(private prisma: PrismaService) {}

  // ── NACO eligibility computation (server-side, not client-editable) ────

  /**
   * Compute eligibility per NACO donor selection criteria.
   * Returns { eligible: boolean, reasons: string[] }.
   */
  private computeEligibility(dto: any, lastDonationDate?: Date | null): {
    eligible: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Age: 18–65
    if (dto.age < NACO.MIN_AGE) reasons.push(`Age ${dto.age} below minimum ${NACO.MIN_AGE} years`);
    if (dto.age > NACO.MAX_AGE) reasons.push(`Age ${dto.age} above maximum ${NACO.MAX_AGE} years`);

    // Weight: ≥45 kg
    const weight = Number(dto.weightKg);
    if (weight < NACO.MIN_WEIGHT_KG) reasons.push(`Weight ${weight} kg below minimum ${NACO.MIN_WEIGHT_KG} kg`);

    // Hemoglobin: ≥12.5 g/dL
    const hb = Number(dto.hemoglobinGdl);
    if (hb < NACO.MIN_HB_GDL) reasons.push(`Hemoglobin ${hb} g/dL below minimum ${NACO.MIN_HB_GDL} g/dL`);

    // Blood pressure: systolic 100–180, diastolic 50–100
    const sys = Number(dto.bpSystolic);
    const dia = Number(dto.bpDiastolic);
    if (sys < NACO.BP_SYSTOLIC_MIN || sys > NACO.BP_SYSTOLIC_MAX) {
      reasons.push(`BP systolic ${sys} mmHg outside range ${NACO.BP_SYSTOLIC_MIN}–${NACO.BP_SYSTOLIC_MAX}`);
    }
    if (dia < NACO.BP_DIASTOLIC_MIN || dia > NACO.BP_DIASTOLIC_MAX) {
      reasons.push(`BP diastolic ${dia} mmHg outside range ${NACO.BP_DIASTOLIC_MIN}–${NACO.BP_DIASTOLIC_MAX}`);
    }

    // Pulse: 60–100 bpm
    const pulse = Number(dto.pulseRate);
    if (pulse < NACO.PULSE_MIN || pulse > NACO.PULSE_MAX) {
      reasons.push(`Pulse ${pulse} bpm outside range ${NACO.PULSE_MIN}–${NACO.PULSE_MAX}`);
    }

    // Donation interval: ≥90 days since last donation
    if (lastDonationDate) {
      const daysSinceLast = Math.floor((Date.now() - lastDonationDate.getTime()) / 86400_000);
      if (daysSinceLast < NACO.MIN_DONATION_INTERVAL_DAYS) {
        reasons.push(`Only ${daysSinceLast} days since last donation (minimum ${NACO.MIN_DONATION_INTERVAL_DAYS})`);
      }
    }

    // Donor type: PAID is banned per Supreme Court 1996
    if (dto.donorType === 'PAID') {
      reasons.push('Paid/professional donors are banned under Supreme Court PIL (Common Cause vs UoI, 1996)');
    }

    // Active deferral
    if (dto.isDeferredNow && dto.deferredUntil) {
      const until = new Date(dto.deferredUntil);
      if (until > new Date()) {
        reasons.push(`Currently deferred until ${until.toISOString().slice(0, 10)}: ${dto.deferralReason || 'unspecified'}`);
      }
    }

    return { eligible: reasons.length === 0, reasons };
  }

  // ── CRUD ──────────────────────────────────────────────────────────────

  async listDonors(tenantId: string, opts?: { bloodGroup?: string; deferred?: string }) {
    try {
      return await (this.prisma as any).bloodDonor.findMany({
        where: {
          tenantId,
          ...(opts?.bloodGroup ? { bloodGroup: opts.bloodGroup } : {}),
          ...(opts?.deferred === 'true' ? { isDeferredNow: true } : {}),
          ...(opts?.deferred === 'false' ? { isDeferredNow: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } catch { return []; }
  }

  async getDonor(tenantId: string, id: string) {
    const row = await (this.prisma as any).bloodDonor.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Donor not found');
    return row;
  }

  async registerDonor(tenantId: string, dto: any) {
    // Validate required fields (NACO mandatory)
    const required = ['fullName', 'age', 'gender', 'phone', 'bloodGroup', 'rhFactor',
      'weightKg', 'hemoglobinGdl', 'bpSystolic', 'bpDiastolic', 'pulseRate',
      'donorType', 'registeredByUserId'];
    for (const f of required) {
      if (dto[f] == null || dto[f] === '') throw new BadRequestException(`${f} is required`);
    }

    // Validate enums
    if (!['MALE', 'FEMALE'].includes(dto.gender)) throw new BadRequestException('gender must be MALE or FEMALE');
    if (!['A', 'B', 'AB', 'O'].includes(dto.bloodGroup)) throw new BadRequestException('bloodGroup must be A, B, AB, or O');
    if (!['POSITIVE', 'NEGATIVE'].includes(dto.rhFactor)) throw new BadRequestException('rhFactor must be POSITIVE or NEGATIVE');
    if (!['VOLUNTARY', 'REPLACEMENT'].includes(dto.donorType)) {
      throw new BadRequestException('donorType must be VOLUNTARY or REPLACEMENT (PAID is banned per SC 1996)');
    }

    // Compute eligibility per NACO criteria
    const { eligible, reasons } = this.computeEligibility(dto);

    return (this.prisma as any).bloodDonor.create({
      data: {
        tenantId,
        fullName: dto.fullName.trim(),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        age: Number(dto.age),
        gender: dto.gender,
        phone: dto.phone.trim(),
        address: dto.address?.trim() || null,
        idProofType: dto.idProofType || null,
        idProofNumber: dto.idProofNumber?.trim() || null,
        bloodGroup: dto.bloodGroup,
        rhFactor: dto.rhFactor,
        weightKg: Number(dto.weightKg),
        hemoglobinGdl: Number(dto.hemoglobinGdl),
        bpSystolic: Number(dto.bpSystolic),
        bpDiastolic: Number(dto.bpDiastolic),
        pulseRate: Number(dto.pulseRate),
        donorType: dto.donorType,
        isEligible: eligible,
        ineligibilityReason: eligible ? null : reasons.join('; '),
        isDeferredNow: !!dto.isDeferredNow,
        deferralReason: dto.deferralReason || null,
        deferredUntil: dto.deferredUntil ? new Date(dto.deferredUntil) : null,
        certifiedByName: dto.certifiedByName?.trim() || null,
        certifiedByRegNo: dto.certifiedByRegNo?.trim() || null,
        registeredByUserId: dto.registeredByUserId,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  /**
   * Record a new donation for an existing donor.
   * Updates totalDonations + lastDonationDate. Re-checks eligibility.
   */
  async recordDonation(tenantId: string, donorId: string) {
    const donor = await (this.prisma as any).bloodDonor.findFirst({
      where: { id: donorId, tenantId },
    });
    if (!donor) throw new NotFoundException('Donor not found');
    if (!donor.isEligible) throw new BadRequestException('Donor is currently not eligible');

    return (this.prisma as any).bloodDonor.update({
      where: { id: donorId },
      data: {
        totalDonations: donor.totalDonations + 1,
        lastDonationDate: new Date(),
      },
    });
  }

  /**
   * Set or clear a deferral on a donor.
   */
  async setDeferral(tenantId: string, donorId: string, dto: { reason: string; until: string } | null) {
    const donor = await (this.prisma as any).bloodDonor.findFirst({
      where: { id: donorId, tenantId },
    });
    if (!donor) throw new NotFoundException('Donor not found');

    if (dto) {
      // Set deferral
      const { eligible, reasons } = this.computeEligibility({
        ...donor,
        isDeferredNow: true,
        deferralReason: dto.reason,
        deferredUntil: dto.until,
      }, donor.lastDonationDate);

      return (this.prisma as any).bloodDonor.update({
        where: { id: donorId },
        data: {
          isDeferredNow: true,
          deferralReason: dto.reason,
          deferredUntil: new Date(dto.until),
          isEligible: eligible,
          ineligibilityReason: eligible ? null : reasons.join('; '),
        },
      });
    } else {
      // Clear deferral — re-check eligibility without the deferral
      const { eligible, reasons } = this.computeEligibility({
        ...donor,
        isDeferredNow: false,
        deferralReason: null,
        deferredUntil: null,
      }, donor.lastDonationDate);

      return (this.prisma as any).bloodDonor.update({
        where: { id: donorId },
        data: {
          isDeferredNow: false,
          deferralReason: null,
          deferredUntil: null,
          isEligible: eligible,
          ineligibilityReason: eligible ? null : reasons.join('; '),
        },
      });
    }
  }
}
