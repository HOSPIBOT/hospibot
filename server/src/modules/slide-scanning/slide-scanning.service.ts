import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SlideScanningService {
  private readonly logger = new Logger(SlideScanningService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, stainType, status, search } = query;
      const where: any = { tenantId };
      if (stainType) where.stainType = stainType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { slideId: { contains: search, mode: 'insensitive' } }, { caseNumber: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.slideScanning.findMany({ where, orderBy: { scanDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.slideScanning.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.slideScanning.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.caseNumber) throw new BadRequestException('Case number is required');
      if (!dto.slideId) throw new BadRequestException('Slide ID is required');
      return await this.prisma.slideScanning.create({
        data: {
          tenantId, caseNumber: dto.caseNumber, slideId: dto.slideId,
          patientId: dto.patientId || null, patientName: dto.patientName || null,
          specimenType: dto.specimenType || null, specimenSite: dto.specimenSite || null,
          stainType: dto.stainType || 'H&E',
          scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
          scannerId: dto.scannerId || null, scannerModel: dto.scannerModel || null,
          magnification: dto.magnification || '40x',
          fileFormat: dto.fileFormat || null, fileSize: dto.fileSize || null,
          imageUrl: dto.imageUrl || null, thumbnailUrl: dto.thumbnailUrl || null,
          focusQuality: dto.focusQuality || null,
          tissueCoverage: dto.tissueCoverage ? Number(dto.tissueCoverage) : null,
          annotations: dto.annotations || null,
          aiAnalysis: dto.aiAnalysis || null,
          pathologistName: dto.pathologistName || null,
          teleconsultRequested: dto.teleconsultRequested || false,
          teleconsultTo: dto.teleconsultTo || null,
          teleconsultResponse: dto.teleconsultResponse || null,
          diagnosis: dto.diagnosis || null,
          icdCode: dto.icdCode || null,
          notes: dto.notes || null, status: dto.status || 'scanned',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.slideScanning.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['caseNumber', 'slideId', 'patientName', 'specimenType', 'specimenSite',
        'stainType', 'scannerId', 'scannerModel', 'magnification', 'fileFormat', 'fileSize',
        'imageUrl', 'thumbnailUrl', 'focusQuality', 'pathologistName',
        'teleconsultRequested', 'teleconsultTo', 'teleconsultResponse',
        'diagnosis', 'icdCode', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      if (dto.tissueCoverage !== undefined) updateData.tissueCoverage = Number(dto.tissueCoverage);
      if (dto.scanDate) updateData.scanDate = new Date(dto.scanDate);
      if (dto.annotations) updateData.annotations = dto.annotations;
      if (dto.aiAnalysis) updateData.aiAnalysis = dto.aiAnalysis;
      return await this.prisma.slideScanning.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byStain, teleconsults] = await Promise.all([
        this.prisma.slideScanning.count({ where: { tenantId } }),
        this.prisma.slideScanning.groupBy({ by: ['stainType'], where: { tenantId }, _count: true }),
        this.prisma.slideScanning.count({ where: { tenantId, teleconsultRequested: true } }),
      ]);
      return { total, teleconsults, byStain: byStain.filter(s => s.stainType).map(s => ({ stain: s.stainType, count: s._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, teleconsults: 0, byStain: [] }; }
  }
}
