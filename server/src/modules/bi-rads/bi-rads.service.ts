import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ACR BI-RADS assessment categories
const BIRADS_CATEGORIES: Record<string, { label: string; action: string }> = {
  '0': { label: 'Incomplete', action: 'Additional imaging needed' },
  '1': { label: 'Negative', action: 'Routine screening' },
  '2': { label: 'Benign', action: 'Routine screening' },
  '3': { label: 'Probably Benign', action: 'Short-interval follow-up (6 months)' },
  '4A': { label: 'Low Suspicion', action: 'Biopsy should be considered' },
  '4B': { label: 'Moderate Suspicion', action: 'Biopsy recommended' },
  '4C': { label: 'High Suspicion', action: 'Biopsy strongly recommended' },
  '5': { label: 'Highly Suggestive of Malignancy', action: 'Biopsy required' },
  '6': { label: 'Known Malignancy', action: 'Surgical excision when appropriate' },
};

@Injectable()
export class BiRadsService {
  private readonly logger = new Logger(BiRadsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, biradsCategory, status, search } = query;
      const where: any = { tenantId };
      if (biradsCategory) where.biradsCategory = biradsCategory;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { patientName: { contains: search, mode: 'insensitive' } },
          { patientUhid: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.biRadsReport.findMany({
          where, orderBy: { studyDate: 'desc' },
          skip: (page - 1) * limit, take: Number(limit),
        }),
        this.prisma.biRadsReport.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.biRadsReport.findFirst({ where: { id, tenantId } });
    } catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.studyDate) throw new BadRequestException('Study date is required');

      // AERB: female radiographer enforcement check is done at frontend level
      const biradsInfo = BIRADS_CATEGORIES[dto.biradsCategory] || null;

      return await this.prisma.biRadsReport.create({
        data: {
          tenantId,
          patientId: dto.patientId || null,
          patientName: dto.patientName,
          patientUhid: dto.patientUhid || null,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          studyDate: new Date(dto.studyDate),
          studyType: dto.studyType || 'screening',
          modality: dto.modality || '2D-mammography',
          laterality: dto.laterality || 'bilateral',
          breastDensity: dto.breastDensity || null,
          findings: dto.findings || null,
          massShape: dto.massShape || null,
          massMargins: dto.massMargins || null,
          massDensity: dto.massDensity || null,
          calcifications: dto.calcifications || null,
          calcMorphology: dto.calcMorphology || null,
          calcDistribution: dto.calcDistribution || null,
          archDistortion: dto.archDistortion || false,
          asymmetry: dto.asymmetry || null,
          skinChanges: dto.skinChanges || false,
          axillaryNodes: dto.axillaryNodes || null,
          biradsCategory: dto.biradsCategory || null,
          biradsLabel: biradsInfo?.label || null,
          recommendedAction: biradsInfo?.action || dto.recommendedAction || null,
          followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
          biopsyRecommended: ['4A', '4B', '4C', '5'].includes(dto.biradsCategory),
          comparisonStudy: dto.comparisonStudy || null,
          impression: dto.impression || null,
          radiologistName: dto.radiologistName || null,
          radiographerName: dto.radiographerName || null,
          radiographerGender: dto.radiographerGender || null,
          equipmentId: dto.equipmentId || null,
          aerbDoseRecorded: dto.aerbDoseRecorded || false,
          mgd: dto.mgd ? Number(dto.mgd) : null,
          notes: dto.notes || null,
          status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.biRadsReport.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Report not found');
      if (existing.status === 'finalized') {
        throw new BadRequestException('Cannot modify a finalized BI-RADS report');
      }

      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'studyType', 'modality', 'laterality',
        'breastDensity', 'findings', 'massShape', 'massMargins', 'massDensity',
        'calcifications', 'calcMorphology', 'calcDistribution', 'archDistortion', 'asymmetry',
        'skinChanges', 'axillaryNodes', 'biradsCategory', 'recommendedAction',
        'comparisonStudy', 'impression', 'radiologistName', 'radiographerName',
        'radiographerGender', 'equipmentId', 'aerbDoseRecorded', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.patientAge !== undefined) updateData.patientAge = Number(dto.patientAge);
      if (dto.mgd !== undefined) updateData.mgd = Number(dto.mgd);
      if (dto.studyDate) updateData.studyDate = new Date(dto.studyDate);
      if (dto.followUpDate) updateData.followUpDate = new Date(dto.followUpDate);

      if (dto.biradsCategory) {
        const info = BIRADS_CATEGORIES[dto.biradsCategory];
        if (info) {
          updateData.biradsLabel = info.label;
          updateData.recommendedAction = info.action;
          updateData.biopsyRecommended = ['4A', '4B', '4C', '5'].includes(dto.biradsCategory);
        }
      }

      return await this.prisma.biRadsReport.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byCategory, byDensity] = await Promise.all([
        this.prisma.biRadsReport.count({ where: { tenantId } }),
        this.prisma.biRadsReport.groupBy({ by: ['biradsCategory'], where: { tenantId }, _count: true }),
        this.prisma.biRadsReport.groupBy({ by: ['breastDensity'], where: { tenantId }, _count: true }),
      ]);
      return {
        total,
        byCategory: byCategory.filter(c => c.biradsCategory).map(c => ({
          category: c.biradsCategory,
          label: BIRADS_CATEGORIES[c.biradsCategory!]?.label || c.biradsCategory,
          count: c._count,
        })),
        byDensity: byDensity.filter(d => d.breastDensity).map(d => ({ density: d.breastDensity, count: d._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byCategory: [], byDensity: [] }; }
  }
}
