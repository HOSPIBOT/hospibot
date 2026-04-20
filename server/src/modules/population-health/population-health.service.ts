import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Population health analytics for diagnostic labs
// IDSP-style disease trend monitoring at lab level
// Risk stratification from lab test data
// NCD prevalence tracking per WHO/ICMR guidelines

@Injectable()
export class PopulationHealthService {
  private readonly logger = new Logger(PopulationHealthService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, cohortType, status, search } = query;
      const where: any = { tenantId };
      if (cohortType) where.cohortType = cohortType;
      if (status) where.status = status;
      if (search) { where.OR = [{ cohortName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.populationCohort.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.populationCohort.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.populationCohort.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.cohortName) throw new BadRequestException('Cohort name required');
      return await this.prisma.populationCohort.create({
        data: {
          tenantId, cohortName: dto.cohortName,
          cohortType: dto.cohortType || 'custom',
          description: dto.description || null,
          // Filters
          ageMin: dto.ageMin ? Number(dto.ageMin) : null, ageMax: dto.ageMax ? Number(dto.ageMax) : null,
          gender: dto.gender || null, location: dto.location || null, pincode: dto.pincode || null,
          diseaseFilter: dto.diseaseFilter || null, testFilter: dto.testFilter || null,
          employerFilter: dto.employerFilter || null,
          dateRangeStart: dto.dateRangeStart ? new Date(dto.dateRangeStart) : null,
          dateRangeEnd: dto.dateRangeEnd ? new Date(dto.dateRangeEnd) : null,
          // Population stats (calculated/aggregated)
          totalPatients: dto.totalPatients ? Number(dto.totalPatients) : null,
          maleCount: dto.maleCount ? Number(dto.maleCount) : null,
          femaleCount: dto.femaleCount ? Number(dto.femaleCount) : null,
          avgAge: dto.avgAge ? Number(dto.avgAge) : null,
          // NCD prevalence
          diabetesPrevalence: dto.diabetesPrevalence ? Number(dto.diabetesPrevalence) : null,
          hypertensionPrevalence: dto.hypertensionPrevalence ? Number(dto.hypertensionPrevalence) : null,
          dyslipidemiaPrevalence: dto.dyslipidemiaPrevalence ? Number(dto.dyslipidemiaPrevalence) : null,
          anemiaPrevalence: dto.anemiaPrevalence ? Number(dto.anemiaPrevalence) : null,
          thyroidPrevalence: dto.thyroidPrevalence ? Number(dto.thyroidPrevalence) : null,
          // Risk stratification
          highRiskCount: dto.highRiskCount ? Number(dto.highRiskCount) : null,
          mediumRiskCount: dto.mediumRiskCount ? Number(dto.mediumRiskCount) : null,
          lowRiskCount: dto.lowRiskCount ? Number(dto.lowRiskCount) : null,
          // Trend data (JSON)
          trendData: dto.trendData || null,
          topAbnormalTests: dto.topAbnormalTests || null,
          seasonalPatterns: dto.seasonalPatterns || null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.populationCohort.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['cohortName', 'cohortType', 'description', 'gender', 'location', 'pincode',
        'diseaseFilter', 'testFilter', 'employerFilter', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['ageMin', 'ageMax', 'totalPatients', 'maleCount', 'femaleCount', 'avgAge',
        'diabetesPrevalence', 'hypertensionPrevalence', 'dyslipidemiaPrevalence',
        'anemiaPrevalence', 'thyroidPrevalence', 'highRiskCount', 'mediumRiskCount', 'lowRiskCount'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['dateRangeStart', 'dateRangeEnd'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.trendData) updateData.trendData = dto.trendData;
      if (dto.topAbnormalTests) updateData.topAbnormalTests = dto.topAbnormalTests;
      if (dto.seasonalPatterns) updateData.seasonalPatterns = dto.seasonalPatterns;
      return await this.prisma.populationCohort.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType] = await Promise.all([
        this.prisma.populationCohort.count({ where: { tenantId } }),
        this.prisma.populationCohort.groupBy({ by: ['cohortType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byType: byType.map(t => ({ type: t.cohortType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [] }; }
  }
}
