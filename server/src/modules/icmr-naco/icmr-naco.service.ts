import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// NACO National AIDS Control Programme (NACP Phase IV/V)
// Report types: HIV Sentinel Surveillance, Viral Load monitoring, PPTCT, EQAS panel
// Submission: District → SACS → NACO
// ICMR: Notifiable disease reporting, AMR surveillance

@Injectable()
export class IcmrNacoService {
  private readonly logger = new Logger(IcmrNacoService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, reportType, status, search } = query;
      const where: any = { tenantId };
      if (reportType) where.reportType = reportType;
      if (status) where.status = status;
      if (search) { where.OR = [{ reportTitle: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.icmrNacoReport.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.icmrNacoReport.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.icmrNacoReport.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.reportType) throw new BadRequestException('Report type required');
      if (!dto.reportingPeriod) throw new BadRequestException('Reporting period required');
      return await this.prisma.icmrNacoReport.create({
        data: {
          tenantId, reportType: dto.reportType, reportTitle: dto.reportTitle || null,
          reportingPeriod: dto.reportingPeriod,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
          // NACO hierarchy
          facilityName: dto.facilityName || null, facilityCode: dto.facilityCode || null,
          districtCode: dto.districtCode || null, stateCode: dto.stateCode || null,
          submittedTo: dto.submittedTo || null,
          sacsName: dto.sacsName || null,
          // HIV testing data
          totalTested: dto.totalTested ? Number(dto.totalTested) : null,
          totalPositive: dto.totalPositive ? Number(dto.totalPositive) : null,
          positivityRate: dto.totalTested && dto.totalPositive ? Math.round((Number(dto.totalPositive) / Number(dto.totalTested)) * 100 * 100) / 100 : null,
          malesTested: dto.malesTested ? Number(dto.malesTested) : null,
          femalesTested: dto.femalesTested ? Number(dto.femalesTested) : null,
          transgenderTested: dto.transgenderTested ? Number(dto.transgenderTested) : null,
          ancTested: dto.ancTested ? Number(dto.ancTested) : null,
          ancPositive: dto.ancPositive ? Number(dto.ancPositive) : null,
          tbPatientsTested: dto.tbPatientsTested ? Number(dto.tbPatientsTested) : null,
          tbPatientsPositive: dto.tbPatientsPositive ? Number(dto.tbPatientsPositive) : null,
          // Viral load
          viralLoadSamplesSent: dto.viralLoadSamplesSent ? Number(dto.viralLoadSamplesSent) : null,
          viralLoadSuppressed: dto.viralLoadSuppressed ? Number(dto.viralLoadSuppressed) : null,
          // EQAS
          eqasPanelId: dto.eqasPanelId || null,
          eqasResult: dto.eqasResult || null,
          eqasConcordance: dto.eqasConcordance ? Number(dto.eqasConcordance) : null,
          // ICMR notifiable diseases
          notifiableDisease: dto.notifiableDisease || null,
          casesReported: dto.casesReported ? Number(dto.casesReported) : null,
          amrData: dto.amrData || null,
          // Submission
          submittedDate: dto.submittedDate ? new Date(dto.submittedDate) : null,
          acknowledgedDate: dto.acknowledgedDate ? new Date(dto.acknowledgedDate) : null,
          acknowledgedBy: dto.acknowledgedBy || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.icmrNacoReport.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['reportType', 'reportTitle', 'reportingPeriod', 'facilityName', 'facilityCode',
        'districtCode', 'stateCode', 'submittedTo', 'sacsName', 'eqasPanelId', 'eqasResult',
        'notifiableDisease', 'acknowledgedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['totalTested', 'totalPositive', 'malesTested', 'femalesTested', 'transgenderTested',
        'ancTested', 'ancPositive', 'tbPatientsTested', 'tbPatientsPositive',
        'viralLoadSamplesSent', 'viralLoadSuppressed', 'eqasConcordance', 'casesReported'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['periodStart', 'periodEnd', 'submittedDate', 'acknowledgedDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.amrData) updateData.amrData = dto.amrData;
      // Auto-calc positivity rate
      if (dto.totalTested && dto.totalPositive) {
        updateData.positivityRate = Math.round((Number(dto.totalPositive) / Number(dto.totalTested)) * 100 * 100) / 100;
      }
      return await this.prisma.icmrNacoReport.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, submitted] = await Promise.all([
        this.prisma.icmrNacoReport.count({ where: { tenantId } }),
        this.prisma.icmrNacoReport.groupBy({ by: ['reportType'], where: { tenantId }, _count: true }),
        this.prisma.icmrNacoReport.count({ where: { tenantId, status: 'submitted' } }),
      ]);
      return { total, submitted, byType: byType.map(t => ({ type: t.reportType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, submitted: 0, byType: [] }; }
  }
}
