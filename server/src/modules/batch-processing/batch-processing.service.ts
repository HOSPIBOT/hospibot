import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// NABL 112A / ISO 15189:2022
// Two levels of QC per batch mandatory
// Ct value interpretation for real-time PCR
// Batch types: RT-PCR, Conventional PCR, NGS Library Prep, Multiplex Panel

@Injectable()
export class BatchProcessingService {
  private readonly logger = new Logger(BatchProcessingService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, batchType, status, search } = query;
      const where: any = { tenantId };
      if (batchType) where.batchType = batchType;
      if (status) where.status = status;
      if (search) { where.OR = [{ batchId: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.batchRun.findMany({ where, orderBy: { runDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
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
      if (!dto.batchId) throw new BadRequestException('Batch ID is required');
      if (!dto.batchType) throw new BadRequestException('Batch type required (rt-pcr/conventional-pcr/ngs-library/multiplex)');

      // NABL 112A: QC mandatory for every batch
      const qcLevel1Result = dto.qcLevel1Result || null;
      const qcLevel2Result = dto.qcLevel2Result || null;
      const qcPassed = (qcLevel1Result === 'pass' && qcLevel2Result === 'pass') ? true : (qcLevel1Result && qcLevel2Result ? false : null);

      return await this.prisma.batchRun.create({
        data: {
          tenantId, batchId: dto.batchId, batchType: dto.batchType,
          testName: dto.testName || null, targetGene: dto.targetGene || null,
          instrumentId: dto.instrumentId || null, instrumentName: dto.instrumentName || null,
          plateLayout: dto.plateLayout || null,
          wellCount: dto.wellCount ? Number(dto.wellCount) : null,
          sampleCount: dto.sampleCount ? Number(dto.sampleCount) : null,
          controlCount: dto.controlCount ? Number(dto.controlCount) : null,
          // QC per NABL 112A
          qcLevel1Result: qcLevel1Result, qcLevel1Value: dto.qcLevel1Value || null,
          qcLevel2Result: qcLevel2Result, qcLevel2Value: dto.qcLevel2Value || null,
          qcPassed: qcPassed,
          positiveControlCt: dto.positiveControlCt ? Number(dto.positiveControlCt) : null,
          negativeControlCt: dto.negativeControlCt || null,
          internalControlCt: dto.internalControlCt ? Number(dto.internalControlCt) : null,
          // Run details
          runDate: dto.runDate ? new Date(dto.runDate) : new Date(),
          runStartTime: dto.runStartTime ? new Date(dto.runStartTime) : null,
          runEndTime: dto.runEndTime ? new Date(dto.runEndTime) : null,
          protocolName: dto.protocolName || null, protocolVersion: dto.protocolVersion || null,
          reagentLotNumber: dto.reagentLotNumber || null,
          reagentExpiry: dto.reagentExpiry ? new Date(dto.reagentExpiry) : null,
          masterMixLot: dto.masterMixLot || null,
          // Results
          positiveCount: dto.positiveCount ? Number(dto.positiveCount) : null,
          negativeCount: dto.negativeCount ? Number(dto.negativeCount) : null,
          indeterminateCount: dto.indeterminateCount ? Number(dto.indeterminateCount) : null,
          invalidCount: dto.invalidCount ? Number(dto.invalidCount) : null,
          // Biosafety
          biosafetyLevel: dto.biosafetyLevel || 'BSL-2',
          decontaminationDone: dto.decontaminationDone || false,
          // Sign-off
          performedBy: dto.performedBy || null, verifiedBy: dto.verifiedBy || null,
          notes: dto.notes || null, status: dto.status || 'pending',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.batchRun.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['batchId', 'batchType', 'testName', 'targetGene', 'instrumentId', 'instrumentName',
        'qcLevel1Result', 'qcLevel1Value', 'qcLevel2Result', 'qcLevel2Value', 'qcPassed',
        'negativeControlCt', 'protocolName', 'protocolVersion', 'reagentLotNumber', 'masterMixLot',
        'biosafetyLevel', 'decontaminationDone', 'performedBy', 'verifiedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['wellCount', 'sampleCount', 'controlCount', 'positiveControlCt', 'internalControlCt',
        'positiveCount', 'negativeCount', 'indeterminateCount', 'invalidCount'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['runDate', 'runStartTime', 'runEndTime', 'reagentExpiry'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      if (dto.plateLayout) updateData.plateLayout = dto.plateLayout;
      return await this.prisma.batchRun.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, qcFailed, byType] = await Promise.all([
        this.prisma.batchRun.count({ where: { tenantId } }),
        this.prisma.batchRun.count({ where: { tenantId, qcPassed: false } }),
        this.prisma.batchRun.groupBy({ by: ['batchType'], where: { tenantId }, _count: true }),
      ]);
      return { total, qcFailedBatches: qcFailed, byType: byType.map(t => ({ type: t.batchType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, qcFailedBatches: 0, byType: [] }; }
  }
}
