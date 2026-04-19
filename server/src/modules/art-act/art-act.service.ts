import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ArtActService {
  private readonly logger = new Logger(ArtActService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, recordType, status, search } = query;
      const where: any = { tenantId };
      if (recordType) where.recordType = recordType;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { referenceNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.artActRecord.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: Number(limit),
        }),
        this.prisma.artActRecord.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.artActRecord.findFirst({ where: { id, tenantId } });
    } catch (err) {
      this.logger.error('findOne error', err);
      return null;
    }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.recordType) throw new BadRequestException('Record type is required');
      if (!dto.title) throw new BadRequestException('Title is required');

      return await this.prisma.artActRecord.create({
        data: {
          tenantId,
          recordType: dto.recordType,
          title: dto.title,
          referenceNumber: dto.referenceNumber || null,
          description: dto.description || null,
          formType: dto.formType || null,
          staffName: dto.staffName || null,
          staffQualification: dto.staffQualification || null,
          staffRole: dto.staffRole || null,
          registrationNumber: dto.registrationNumber || null,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          renewalDueDate: dto.renewalDueDate ? new Date(dto.renewalDueDate) : null,
          submittedTo: dto.submittedTo || null,
          submittedDate: dto.submittedDate ? new Date(dto.submittedDate) : null,
          approvedDate: dto.approvedDate ? new Date(dto.approvedDate) : null,
          inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
          inspectionResult: dto.inspectionResult || null,
          complianceNotes: dto.complianceNotes || null,
          status: dto.status || 'pending',
          notes: dto.notes || null,
          createdBy: userId,
        },
      });
    } catch (err) {
      this.logger.error('create error', err);
      throw err;
    }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.artActRecord.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');

      const updateData: any = {};
      const fields = ['title', 'referenceNumber', 'description', 'formType', 'staffName',
        'staffQualification', 'staffRole', 'registrationNumber', 'submittedTo',
        'inspectionResult', 'complianceNotes', 'status', 'notes'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const dateFields = ['validFrom', 'validUntil', 'renewalDueDate', 'submittedDate', 'approvedDate', 'inspectionDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }

      return await this.prisma.artActRecord.update({ where: { id }, data: updateData });
    } catch (err) {
      this.logger.error('update error', err);
      throw err;
    }
  }

  async getComplianceDashboard(tenantId: string) {
    try {
      const [total, byType, byStatus, expiringSoon] = await Promise.all([
        this.prisma.artActRecord.count({ where: { tenantId } }),
        this.prisma.artActRecord.groupBy({ by: ['recordType'], where: { tenantId }, _count: true }),
        this.prisma.artActRecord.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
        this.prisma.artActRecord.count({
          where: {
            tenantId,
            renewalDueDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
            status: { not: 'expired' },
          },
        }),
      ]);
      return {
        total,
        expiringSoon,
        byType: byType.map(t => ({ type: t.recordType, count: t._count })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      };
    } catch (err) {
      this.logger.error('getComplianceDashboard error', err);
      return { total: 0, expiringSoon: 0, byType: [], byStatus: [] };
    }
  }
}
