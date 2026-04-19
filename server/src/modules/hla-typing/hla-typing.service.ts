import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HlaTypingService {
  private readonly logger = new Logger(HlaTypingService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, sampleType, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (sampleType) where.sampleType = sampleType;
      if (search) {
        where.OR = [
          { patientName: { contains: search, mode: 'insensitive' } },
          { donorRegistryId: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.hlaTyping.findMany({
          where, orderBy: { testDate: 'desc' },
          skip: (page - 1) * limit, take: Number(limit),
        }),
        this.prisma.hlaTyping.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.hlaTyping.findFirst({ where: { id, tenantId } });
    } catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient/donor name is required');
      if (!dto.sampleType) throw new BadRequestException('Sample type (donor/recipient) is required');

      // NOTTO requires consent for organ/tissue donation typing
      if (dto.sampleType === 'donor' && !dto.consentObtained) {
        throw new BadRequestException(
          'Donor consent is mandatory per NOTTO (National Organ & Tissue Transplant Organisation) guidelines'
        );
      }

      // Calculate match score if both patient and donor HLA provided
      let matchScore = null;
      if (dto.hlaA1 && dto.recipientHlaA1) {
        matchScore = this.calculateMatchScore(dto);
      }

      return await this.prisma.hlaTyping.create({
        data: {
          tenantId,
          patientId: dto.patientId || null,
          patientName: dto.patientName,
          patientUhid: dto.patientUhid || null,
          sampleType: dto.sampleType,
          donorRegistryId: dto.donorRegistryId || null,
          testDate: dto.testDate ? new Date(dto.testDate) : new Date(),
          method: dto.method || 'pcr-ssp',
          indication: dto.indication || null,
          // Class I HLA
          hlaA1: dto.hlaA1 || null, hlaA2: dto.hlaA2 || null,
          hlaB1: dto.hlaB1 || null, hlaB2: dto.hlaB2 || null,
          hlaC1: dto.hlaC1 || null, hlaC2: dto.hlaC2 || null,
          // Class II HLA
          hlaDr1: dto.hlaDr1 || null, hlaDr2: dto.hlaDr2 || null,
          hlaDq1: dto.hlaDq1 || null, hlaDq2: dto.hlaDq2 || null,
          hlaDp1: dto.hlaDp1 || null, hlaDp2: dto.hlaDp2 || null,
          // Recipient HLA for comparison
          recipientHlaA1: dto.recipientHlaA1 || null, recipientHlaA2: dto.recipientHlaA2 || null,
          recipientHlaB1: dto.recipientHlaB1 || null, recipientHlaB2: dto.recipientHlaB2 || null,
          recipientHlaDr1: dto.recipientHlaDr1 || null, recipientHlaDr2: dto.recipientHlaDr2 || null,
          // Match result
          matchScore: matchScore,
          crossmatchResult: dto.crossmatchResult || null,
          antibodyScreen: dto.antibodyScreen || null,
          pra: dto.pra ? Number(dto.pra) : null,
          // NOTTO compliance
          consentObtained: dto.consentObtained || false,
          nottoRegistered: dto.nottoRegistered || false,
          nottoId: dto.nottoId || null,
          wmdaId: dto.wmdaId || null,
          // Report
          interpretation: dto.interpretation || null,
          reportedBy: dto.reportedBy || null,
          verifiedBy: dto.verifiedBy || null,
          notes: dto.notes || null,
          status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.hlaTyping.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');

      const updateData: any = {};
      const fields = ['patientName', 'patientUhid', 'sampleType', 'donorRegistryId', 'method', 'indication',
        'hlaA1', 'hlaA2', 'hlaB1', 'hlaB2', 'hlaC1', 'hlaC2',
        'hlaDr1', 'hlaDr2', 'hlaDq1', 'hlaDq2', 'hlaDp1', 'hlaDp2',
        'recipientHlaA1', 'recipientHlaA2', 'recipientHlaB1', 'recipientHlaB2',
        'recipientHlaDr1', 'recipientHlaDr2',
        'crossmatchResult', 'antibodyScreen', 'interpretation',
        'consentObtained', 'nottoRegistered', 'nottoId', 'wmdaId',
        'reportedBy', 'verifiedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.pra !== undefined) updateData.pra = Number(dto.pra);
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);

      // Recalculate match if HLA changed
      const merged = { ...existing, ...dto };
      if (merged.hlaA1 && merged.recipientHlaA1) {
        updateData.matchScore = this.calculateMatchScore(merged);
      }

      return await this.prisma.hlaTyping.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, byMethod] = await Promise.all([
        this.prisma.hlaTyping.count({ where: { tenantId } }),
        this.prisma.hlaTyping.groupBy({ by: ['sampleType'], where: { tenantId }, _count: true }),
        this.prisma.hlaTyping.groupBy({ by: ['method'], where: { tenantId }, _count: true }),
      ]);
      return {
        total,
        byType: byType.map(t => ({ type: t.sampleType, count: t._count })),
        byMethod: byMethod.filter(m => m.method).map(m => ({ method: m.method, count: m._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [], byMethod: [] }; }
  }

  private calculateMatchScore(dto: any): number {
    let matched = 0;
    const total = 6; // A, B, DR (2 alleles each = 6 antigens)
    if (dto.hlaA1 === dto.recipientHlaA1 || dto.hlaA1 === dto.recipientHlaA2) matched++;
    if (dto.hlaA2 === dto.recipientHlaA1 || dto.hlaA2 === dto.recipientHlaA2) matched++;
    if (dto.hlaB1 === dto.recipientHlaB1 || dto.hlaB1 === dto.recipientHlaB2) matched++;
    if (dto.hlaB2 === dto.recipientHlaB1 || dto.hlaB2 === dto.recipientHlaB2) matched++;
    if (dto.hlaDr1 === dto.recipientHlaDr1 || dto.hlaDr1 === dto.recipientHlaDr2) matched++;
    if (dto.hlaDr2 === dto.recipientHlaDr1 || dto.hlaDr2 === dto.recipientHlaDr2) matched++;
    return matched;
  }
}
