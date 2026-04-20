import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// AERB (Atomic Energy Regulatory Board) / BARC reporting
// AERB Safety Code SC-3 Rev.2 for diagnostic radiology
// eLORA = e-Licensing of Radiation Applications
// Occupational dose: 20 mSv/yr avg 5yr, max 50 mSv single year
// Public dose: 1 mSv/yr
// Personnel monitoring: TLD badges, RSO oversight

@Injectable()
export class BarcReportingService {
  private readonly logger = new Logger(BarcReportingService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, reportType, status, search } = query;
      const where: any = { tenantId };
      if (reportType) where.reportType = reportType;
      if (status) where.status = status;
      if (search) { where.OR = [{ reportTitle: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.barcReport.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.barcReport.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.barcReport.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.reportType) throw new BadRequestException('Report type required (annual-return/excessive-exposure/equipment-qa/license-renewal/rso-report)');
      return await this.prisma.barcReport.create({
        data: {
          tenantId, reportType: dto.reportType, reportTitle: dto.reportTitle || null,
          reportingPeriod: dto.reportingPeriod || null,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
          // AERB license
          aerbLicenseNo: dto.aerbLicenseNo || null, aerbLicenseExpiry: dto.aerbLicenseExpiry ? new Date(dto.aerbLicenseExpiry) : null,
          eloraRegistrationId: dto.eloraRegistrationId || null,
          facilityCategory: dto.facilityCategory || null,
          // RSO details
          rsoName: dto.rsoName || null, rsoCertLevel: dto.rsoCertLevel || null,
          rsoCertNo: dto.rsoCertNo || null, rsoCertExpiry: dto.rsoCertExpiry ? new Date(dto.rsoCertExpiry) : null,
          // Equipment inventory
          equipmentType: dto.equipmentType || null, equipmentMake: dto.equipmentMake || null,
          equipmentModel: dto.equipmentModel || null, equipmentSerialNo: dto.equipmentSerialNo || null,
          installationDate: dto.installationDate ? new Date(dto.installationDate) : null,
          lastQaDate: dto.lastQaDate ? new Date(dto.lastQaDate) : null,
          nextQaDue: dto.nextQaDue ? new Date(dto.nextQaDue) : null,
          qaAgency: dto.qaAgency || null, qaResult: dto.qaResult || null,
          // Occupational dose monitoring (AERB limits)
          totalWorkersMonitored: dto.totalWorkersMonitored ? Number(dto.totalWorkersMonitored) : null,
          workersExceeding6mSv: dto.workersExceeding6mSv ? Number(dto.workersExceeding6mSv) : null,
          workersExceeding20mSv: dto.workersExceeding20mSv ? Number(dto.workersExceeding20mSv) : null,
          maxDoseRecordedMsv: dto.maxDoseRecordedMsv ? Number(dto.maxDoseRecordedMsv) : null,
          avgDoseMsv: dto.avgDoseMsv ? Number(dto.avgDoseMsv) : null,
          tldBadgeProvider: dto.tldBadgeProvider || null,
          // Excessive exposure
          excessiveExposureReported: dto.excessiveExposureReported || false,
          exposureWorkerName: dto.exposureWorkerName || null,
          exposureDoseMsv: dto.exposureDoseMsv ? Number(dto.exposureDoseMsv) : null,
          exposureDate: dto.exposureDate ? new Date(dto.exposureDate) : null,
          investigationDone: dto.investigationDone || false,
          investigationFindings: dto.investigationFindings || null,
          correctiveAction: dto.correctiveAction || null,
          // Shielding
          roomShieldingAdequate: dto.roomShieldingAdequate || null,
          lastShieldingSurvey: dto.lastShieldingSurvey ? new Date(dto.lastShieldingSurvey) : null,
          // Submission
          submittedToAerb: dto.submittedToAerb || false,
          submissionDate: dto.submissionDate ? new Date(dto.submissionDate) : null,
          aerbAcknowledgement: dto.aerbAcknowledgement || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.barcReport.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['reportType', 'reportTitle', 'reportingPeriod', 'aerbLicenseNo', 'eloraRegistrationId',
        'facilityCategory', 'rsoName', 'rsoCertLevel', 'rsoCertNo', 'equipmentType', 'equipmentMake',
        'equipmentModel', 'equipmentSerialNo', 'qaAgency', 'qaResult', 'tldBadgeProvider',
        'excessiveExposureReported', 'exposureWorkerName', 'investigationDone', 'investigationFindings',
        'correctiveAction', 'roomShieldingAdequate', 'submittedToAerb', 'aerbAcknowledgement', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['totalWorkersMonitored', 'workersExceeding6mSv', 'workersExceeding20mSv',
        'maxDoseRecordedMsv', 'avgDoseMsv', 'exposureDoseMsv'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['periodStart', 'periodEnd', 'aerbLicenseExpiry', 'rsoCertExpiry',
        'installationDate', 'lastQaDate', 'nextQaDue', 'exposureDate', 'lastShieldingSurvey', 'submissionDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.barcReport.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, excessive] = await Promise.all([
        this.prisma.barcReport.count({ where: { tenantId } }),
        this.prisma.barcReport.groupBy({ by: ['reportType'], where: { tenantId }, _count: true }),
        this.prisma.barcReport.count({ where: { tenantId, excessiveExposureReported: true } }),
      ]);
      return { total, excessiveExposures: excessive, byType: byType.map(t => ({ type: t.reportType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, excessiveExposures: 0, byType: [] }; }
  }
}
