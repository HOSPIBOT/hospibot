import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// ACMG/AMP 2015 Variant Classification Standards
// 5 tiers: Pathogenic, Likely Pathogenic, VUS, Likely Benign, Benign
// 28 evidence criteria: PVS1, PS1-4, PM1-6, PP1-5, BA1, BS1-4, BP1-7

@Injectable()
export class VariantDatabaseService {
  private readonly logger = new Logger(VariantDatabaseService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, acmgClass, gene, search } = query;
      const where: any = { tenantId };
      if (acmgClass) where.acmgClass = acmgClass;
      if (gene) where.gene = gene;
      if (search) { where.OR = [{ gene: { contains: search, mode: 'insensitive' } }, { hgvsC: { contains: search, mode: 'insensitive' } }, { hgvsP: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.variantRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.variantRecord.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.variantRecord.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.gene) throw new BadRequestException('Gene name required');
      if (!dto.acmgClass) throw new BadRequestException('ACMG classification required (Pathogenic/Likely Pathogenic/VUS/Likely Benign/Benign)');

      const validClasses = ['Pathogenic', 'Likely Pathogenic', 'VUS', 'Likely Benign', 'Benign'];
      if (!validClasses.includes(dto.acmgClass)) {
        throw new BadRequestException('Invalid ACMG class. Must be: ' + validClasses.join(', '));
      }

      return await this.prisma.variantRecord.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName || null,
          // Variant identification
          gene: dto.gene, transcript: dto.transcript || null,
          hgvsC: dto.hgvsC || null, hgvsP: dto.hgvsP || null,
          genomicPosition: dto.genomicPosition || null,
          chromosome: dto.chromosome || null,
          variantType: dto.variantType || null,
          zygosity: dto.zygosity || null,
          alleleFrequency: dto.alleleFrequency ? Number(dto.alleleFrequency) : null,
          // ACMG Classification
          acmgClass: dto.acmgClass,
          criteriaApplied: dto.criteriaApplied || null,
          evidenceStrength: dto.evidenceStrength || null,
          // External databases
          clinvarId: dto.clinvarId || null,
          clinvarSignificance: dto.clinvarSignificance || null,
          dbsnpId: dto.dbsnpId || null,
          gnomadFreq: dto.gnomadFreq ? Number(dto.gnomadFreq) : null,
          cosmicId: dto.cosmicId || null,
          // Functional
          inSilicoPrediction: dto.inSilicoPrediction || null,
          revelScore: dto.revelScore ? Number(dto.revelScore) : null,
          caddScore: dto.caddScore ? Number(dto.caddScore) : null,
          conservationScore: dto.conservationScore ? Number(dto.conservationScore) : null,
          // Clinical
          disease: dto.disease || null, inheritanceMode: dto.inheritanceMode || null,
          phenotype: dto.phenotype || null,
          // Lab
          detectionMethod: dto.detectionMethod || null,
          sequencingPlatform: dto.sequencingPlatform || null,
          coverage: dto.coverage ? Number(dto.coverage) : null,
          classifiedBy: dto.classifiedBy || null,
          classificationDate: dto.classificationDate ? new Date(dto.classificationDate) : new Date(),
          reviewedBy: dto.reviewedBy || null,
          notes: dto.notes || null, status: dto.status || 'classified',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.variantRecord.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      if (dto.acmgClass) {
        const validClasses = ['Pathogenic', 'Likely Pathogenic', 'VUS', 'Likely Benign', 'Benign'];
        if (!validClasses.includes(dto.acmgClass)) throw new BadRequestException('Invalid ACMG class');
      }
      const updateData: any = {};
      const fields = ['patientName', 'gene', 'transcript', 'hgvsC', 'hgvsP', 'genomicPosition',
        'chromosome', 'variantType', 'zygosity', 'acmgClass', 'criteriaApplied', 'evidenceStrength',
        'clinvarId', 'clinvarSignificance', 'dbsnpId', 'cosmicId', 'inSilicoPrediction',
        'disease', 'inheritanceMode', 'phenotype', 'detectionMethod', 'sequencingPlatform',
        'classifiedBy', 'reviewedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['alleleFrequency', 'gnomadFreq', 'revelScore', 'caddScore', 'conservationScore', 'coverage'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.classificationDate) updateData.classificationDate = new Date(dto.classificationDate);
      return await this.prisma.variantRecord.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byClass, byGene] = await Promise.all([
        this.prisma.variantRecord.count({ where: { tenantId } }),
        this.prisma.variantRecord.groupBy({ by: ['acmgClass'], where: { tenantId }, _count: true }),
        this.prisma.variantRecord.groupBy({ by: ['gene'], where: { tenantId }, _count: true, orderBy: { _count: { gene: 'desc' } }, take: 10 }),
      ]);
      return {
        total,
        byAcmgClass: byClass.map(c => ({ classification: c.acmgClass, count: c._count })),
        topGenes: byGene.map(g => ({ gene: g.gene, count: g._count })),
      };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byAcmgClass: [], topGenes: [] }; }
  }
}
