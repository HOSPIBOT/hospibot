import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BatchProcessingService {
  private readonly logger = new Logger(BatchProcessingService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ title: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.batchRun.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.batchRun.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.batchRun.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      return await this.prisma.batchRun.create({ data: { ...dto, tenantId, createdBy: userId } });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.batchRun.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      return await this.prisma.batchRun.update({ where: { id }, data: dto });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const total = await this.prisma.batchRun.count({ where: { tenantId } });
      return { total };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0 }; }
  }
}
