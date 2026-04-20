import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// NHGRI Standard Pedigree Notation
// Inheritance patterns: AD (Autosomal Dominant), AR (Autosomal Recessive),
// XL (X-Linked), XLR, Mitochondrial, Multifactorial

@Injectable()
export class PedigreeBuilderService {
  private readonly logger = new Logger(PedigreeBuilderService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ probandName: { contains: search, mode: 'insensitive' } }, { condition: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.pedigreeRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.pedigreeRecord.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.pedigreeRecord.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.probandName) throw new BadRequestException('Proband (index patient) name required');
      return await this.prisma.pedigreeRecord.create({
        data: {
          tenantId, patientId: dto.patientId || null,
          probandName: dto.probandName,
          probandAge: dto.probandAge ? Number(dto.probandAge) : null,
          probandGender: dto.probandGender || null,
          condition: dto.condition || null,
          geneOfInterest: dto.geneOfInterest || null,
          inheritancePattern: dto.inheritancePattern || null,
          generations: dto.generations ? Number(dto.generations) : null,
          totalMembers: dto.totalMembers ? Number(dto.totalMembers) : null,
          affectedMembers: dto.affectedMembers ? Number(dto.affectedMembers) : null,
          carrierMembers: dto.carrierMembers ? Number(dto.carrierMembers) : null,
          deceasedMembers: dto.deceasedMembers ? Number(dto.deceasedMembers) : null,
          // Family tree data (JSON — NHGRI notation encoded)
          familyData: dto.familyData || null,
          consanguinity: dto.consanguinity || false,
          ethnicBackground: dto.ethnicBackground || null,
          // Clinical
          referralReason: dto.referralReason || null,
          counselorName: dto.counselorName || null,
          geneticistName: dto.geneticistName || null,
          riskAssessment: dto.riskAssessment || null,
          recommendedTesting: dto.recommendedTesting || null,
          notes: dto.notes || null, status: dto.status || 'draft',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.pedigreeRecord.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['probandName', 'probandGender', 'condition', 'geneOfInterest',
        'inheritancePattern', 'consanguinity', 'ethnicBackground', 'referralReason',
        'counselorName', 'geneticistName', 'riskAssessment', 'recommendedTesting', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['probandAge', 'generations', 'totalMembers', 'affectedMembers', 'carrierMembers', 'deceasedMembers'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.familyData) updateData.familyData = dto.familyData;
      return await this.prisma.pedigreeRecord.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byPattern] = await Promise.all([
        this.prisma.pedigreeRecord.count({ where: { tenantId } }),
        this.prisma.pedigreeRecord.groupBy({ by: ['inheritancePattern'], where: { tenantId }, _count: true }),
      ]);
      return { total, byInheritance: byPattern.filter(p => p.inheritancePattern).map(p => ({ pattern: p.inheritancePattern, count: p._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byInheritance: [] }; }
  }
}
