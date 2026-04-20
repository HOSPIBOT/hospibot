import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// DGHS = Directorate General of Health Services (apex advisory body)
// IDSP = Integrated Disease Surveillance Programme
// IHIP = Integrated Health Information Platform (real-time)
// Forms: S (suspected/syndromic), P (presumptive/clinical), L (lab confirmed)
// Hierarchy: DSU (District) → SSU (State) → CSU (Central/NCDC)
// Weekly reporting (Mon-Sun), 33+ disease conditions
// AMR surveillance: WHONET software reporting to NCDC

@Injectable()
export class DghsReportingService {
  private readonly logger = new Logger(DghsReportingService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, reportForm, diseaseCode, status, search } = query;
      const where: any = { tenantId };
      if (reportForm) where.reportForm = reportForm;
      if (diseaseCode) where.diseaseCode = diseaseCode;
      if (status) where.status = status;
      if (search) { where.OR = [{ diseaseName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.dghsReport.findMany({ where, orderBy: { reportingWeekEnd: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.dghsReport.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.dghsReport.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.reportForm) throw new BadRequestException('Report form required (S/P/L)');
      if (!dto.diseaseName) throw new BadRequestException('Disease name required');

      const validForms = ['S', 'P', 'L'];
      if (!validForms.includes(dto.reportForm)) {
        throw new BadRequestException('Report form must be S (suspected), P (presumptive), or L (lab confirmed)');
      }

      return await this.prisma.dghsReport.create({
        data: {
          tenantId, reportForm: dto.reportForm,
          diseaseCode: dto.diseaseCode || null, diseaseName: dto.diseaseName,
          // Reporting period (IDSP: weekly Mon-Sun)
          reportingWeekStart: dto.reportingWeekStart ? new Date(dto.reportingWeekStart) : null,
          reportingWeekEnd: dto.reportingWeekEnd ? new Date(dto.reportingWeekEnd) : null,
          epiWeekNumber: dto.epiWeekNumber ? Number(dto.epiWeekNumber) : null,
          reportingYear: dto.reportingYear ? Number(dto.reportingYear) : new Date().getFullYear(),
          // Facility
          facilityName: dto.facilityName || null, facilityCode: dto.facilityCode || null,
          districtName: dto.districtName || null, districtCode: dto.districtCode || null,
          stateName: dto.stateName || null, stateCode: dto.stateCode || null,
          // Case data
          casesReported: dto.casesReported ? Number(dto.casesReported) : null,
          deathsReported: dto.deathsReported ? Number(dto.deathsReported) : null,
          malesCases: dto.malesCases ? Number(dto.malesCases) : null,
          femalesCases: dto.femalesCases ? Number(dto.femalesCases) : null,
          age0to5: dto.age0to5 ? Number(dto.age0to5) : null,
          age5to14: dto.age5to14 ? Number(dto.age5to14) : null,
          age15to44: dto.age15to44 ? Number(dto.age15to44) : null,
          age45plus: dto.age45plus ? Number(dto.age45plus) : null,
          // Lab details (Form L specific)
          labTestPerformed: dto.labTestPerformed || null,
          samplesCollected: dto.samplesCollected ? Number(dto.samplesCollected) : null,
          samplesPositive: dto.samplesPositive ? Number(dto.samplesPositive) : null,
          organism: dto.organism || null,
          // AMR
          amrRelevant: dto.amrRelevant || false,
          amrOrganism: dto.amrOrganism || null,
          amrPattern: dto.amrPattern || null,
          whonetExported: dto.whonetExported || false,
          // Submission
          submittedToIhip: dto.submittedToIhip || false,
          ihipSubmissionDate: dto.ihipSubmissionDate ? new Date(dto.ihipSubmissionDate) : null,
          submittedToDsu: dto.submittedToDsu || false,
          dsuOfficerName: dto.dsuOfficerName || null,
          alertGenerated: dto.alertGenerated || false,
          outbreakInvestigated: dto.outbreakInvestigated || false,
          // Blood bank reporting
          bloodBankReporting: dto.bloodBankReporting || false,
          unitsCollected: dto.unitsCollected ? Number(dto.unitsCollected) : null,
          ttisDetected: dto.ttisDetected ? Number(dto.ttisDetected) : null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.dghsReport.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['reportForm', 'diseaseCode', 'diseaseName', 'facilityName', 'facilityCode',
        'districtName', 'districtCode', 'stateName', 'stateCode', 'labTestPerformed',
        'organism', 'amrRelevant', 'amrOrganism', 'amrPattern', 'whonetExported',
        'submittedToIhip', 'submittedToDsu', 'dsuOfficerName', 'alertGenerated',
        'outbreakInvestigated', 'bloodBankReporting', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['epiWeekNumber', 'reportingYear', 'casesReported', 'deathsReported',
        'malesCases', 'femalesCases', 'age0to5', 'age5to14', 'age15to44', 'age45plus',
        'samplesCollected', 'samplesPositive', 'unitsCollected', 'ttisDetected'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['reportingWeekStart', 'reportingWeekEnd', 'ihipSubmissionDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.dghsReport.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byForm, byDisease] = await Promise.all([
        this.prisma.dghsReport.count({ where: { tenantId } }),
        this.prisma.dghsReport.groupBy({ by: ['reportForm'], where: { tenantId }, _count: true }),
        this.prisma.dghsReport.groupBy({ by: ['diseaseName'], where: { tenantId }, _count: true, orderBy: { _count: { diseaseName: 'desc' } }, take: 10 }),
      ]);
      return { total, byForm: byForm.map(f => ({ form: f.reportForm, count: f._count })), topDiseases: byDisease.map(d => ({ disease: d.diseaseName, count: d._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byForm: [], topDiseases: [] }; }
  }
}
