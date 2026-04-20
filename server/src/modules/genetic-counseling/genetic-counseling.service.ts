import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ACMG/NSGC Guidelines, Blueprint §12
// Doctor-ordered only, pre/post-test counseling, VUS disclosure
// Counselor certification: ABMG/ABGC or equivalent Indian qualification

@Injectable()
export class GeneticCounselingService {
  private readonly logger = new Logger(GeneticCounselingService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, sessionType, status, search } = query;
      const where: any = { tenantId };
      if (sessionType) where.sessionType = sessionType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { counselorName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.geneticCounseling.findMany({ where, orderBy: { sessionDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.geneticCounseling.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.geneticCounseling.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.sessionType) throw new BadRequestException('Session type required (pre-test/post-test/follow-up/carrier-screening/prenatal/cancer-risk)');
      if (!dto.orderingPhysician) throw new BadRequestException('Ordering physician mandatory — genetic tests are doctor-ordered only');

      return await this.prisma.geneticCounseling.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          sessionType: dto.sessionType,
          sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : new Date(),
          sessionDurationMin: dto.sessionDurationMin ? Number(dto.sessionDurationMin) : null,
          // Counselor
          counselorName: dto.counselorName || null,
          counselorCertification: dto.counselorCertification || null,
          counselorRegNo: dto.counselorRegNo || null,
          // Ordering
          orderingPhysician: dto.orderingPhysician,
          referralReason: dto.referralReason || null,
          clinicalIndication: dto.clinicalIndication || null,
          familyHistory: dto.familyHistory || null,
          // Test details
          testOrdered: dto.testOrdered || null,
          testCategory: dto.testCategory || null,
          expectedTatDays: dto.expectedTatDays ? Number(dto.expectedTatDays) : null,
          sampleCollected: dto.sampleCollected || false,
          sampleType: dto.sampleType || null,
          // Consent
          informedConsentSigned: dto.informedConsentSigned || false,
          consentDate: dto.consentDate ? new Date(dto.consentDate) : null,
          incidentalFindingsConsent: dto.incidentalFindingsConsent || null,
          // Pre-test counseling
          riskExplained: dto.riskExplained || false,
          limitationsExplained: dto.limitationsExplained || false,
          psychosocialAssessment: dto.psychosocialAssessment || null,
          // Post-test / results
          resultDisclosed: dto.resultDisclosed || false,
          resultDisclosureDate: dto.resultDisclosureDate ? new Date(dto.resultDisclosureDate) : null,
          variantClassification: dto.variantClassification || null,
          vusFound: dto.vusFound || false,
          vusExplained: dto.vusExplained || false,
          actionableFindings: dto.actionableFindings || null,
          recommendedFollowUp: dto.recommendedFollowUp || null,
          familyCascadeTesting: dto.familyCascadeTesting || null,
          // Notes
          sessionNotes: dto.sessionNotes || null,
          notes: dto.notes || null, status: dto.status || 'scheduled',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.geneticCounseling.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'sessionType', 'counselorName',
        'counselorCertification', 'counselorRegNo', 'orderingPhysician', 'referralReason',
        'clinicalIndication', 'familyHistory', 'testOrdered', 'testCategory', 'sampleCollected',
        'sampleType', 'informedConsentSigned', 'incidentalFindingsConsent', 'riskExplained',
        'limitationsExplained', 'psychosocialAssessment', 'resultDisclosed', 'variantClassification',
        'vusFound', 'vusExplained', 'actionableFindings', 'recommendedFollowUp',
        'familyCascadeTesting', 'sessionNotes', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'sessionDurationMin', 'expectedTatDays'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['sessionDate', 'consentDate', 'resultDisclosureDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.geneticCounseling.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, vusCount] = await Promise.all([
        this.prisma.geneticCounseling.count({ where: { tenantId } }),
        this.prisma.geneticCounseling.groupBy({ by: ['sessionType'], where: { tenantId }, _count: true }),
        this.prisma.geneticCounseling.count({ where: { tenantId, vusFound: true } }),
      ]);
      return { total, vusDisclosures: vusCount, byType: byType.map(t => ({ type: t.sessionType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, vusDisclosures: 0, byType: [] }; }
  }
}
