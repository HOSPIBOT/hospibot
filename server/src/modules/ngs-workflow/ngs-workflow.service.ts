import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// CAP NGS Work Group: 18 laboratory accreditation checklist requirements
// Key QC: Q30 ≥80%, cluster density (K/mm²), PF%, yield (Gb), error rate
// Workflow: extraction → fragmentation → barcoding → enrichment → ligation → amplification → library QC → sequencing → bioinformatics

@Injectable()
export class NgsWorkflowService {
  private readonly logger = new Logger(NgsWorkflowService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, runStatus, platform, search } = query;
      const where: any = { tenantId };
      if (runStatus) where.runStatus = runStatus;
      if (platform) where.platform = platform;
      if (search) { where.OR = [{ runId: { contains: search, mode: 'insensitive' } }, { panelName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.ngsRun.findMany({ where, orderBy: { runDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.ngsRun.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.ngsRun.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.runId) throw new BadRequestException('Run ID required');
      if (!dto.platform) throw new BadRequestException('Sequencing platform required');

      // Auto-assess run quality from Q30
      let runQuality = null;
      if (dto.q30Pct) {
        const q30 = Number(dto.q30Pct);
        runQuality = q30 >= 80 ? 'pass' : q30 >= 70 ? 'marginal' : 'fail';
      }

      return await this.prisma.ngsRun.create({
        data: {
          tenantId, runId: dto.runId,
          platform: dto.platform, instrumentId: dto.instrumentId || null,
          instrumentName: dto.instrumentName || null,
          flowcellId: dto.flowcellId || null, flowcellType: dto.flowcellType || null,
          panelName: dto.panelName || null, panelVersion: dto.panelVersion || null,
          enrichmentMethod: dto.enrichmentMethod || null,
          // Samples
          sampleCount: dto.sampleCount ? Number(dto.sampleCount) : null,
          indexType: dto.indexType || null,
          // Library prep
          libraryPrepKit: dto.libraryPrepKit || null, libraryPrepDate: dto.libraryPrepDate ? new Date(dto.libraryPrepDate) : null,
          fragmentSizeBp: dto.fragmentSizeBp ? Number(dto.fragmentSizeBp) : null,
          libraryConcentration: dto.libraryConcentration ? Number(dto.libraryConcentration) : null,
          libraryQcPassed: dto.libraryQcPassed || null,
          poolingRatio: dto.poolingRatio || null,
          // Run
          runDate: dto.runDate ? new Date(dto.runDate) : new Date(),
          readLength: dto.readLength || null, readType: dto.readType || null,
          // QC metrics (CAP/Illumina)
          clusterDensity: dto.clusterDensity ? Number(dto.clusterDensity) : null,
          clustersPfPct: dto.clustersPfPct ? Number(dto.clustersPfPct) : null,
          q30Pct: dto.q30Pct ? Number(dto.q30Pct) : null,
          yieldGb: dto.yieldGb ? Number(dto.yieldGb) : null,
          errorRate: dto.errorRate ? Number(dto.errorRate) : null,
          phasingPct: dto.phasingPct ? Number(dto.phasingPct) : null,
          prephasingPct: dto.prephasingPct ? Number(dto.prephasingPct) : null,
          runQuality: runQuality,
          // Bioinformatics
          pipelineName: dto.pipelineName || null, pipelineVersion: dto.pipelineVersion || null,
          referenceGenome: dto.referenceGenome || null,
          avgCoverage: dto.avgCoverage ? Number(dto.avgCoverage) : null,
          pctTargetCovered20x: dto.pctTargetCovered20x ? Number(dto.pctTargetCovered20x) : null,
          totalVariantsCalled: dto.totalVariantsCalled ? Number(dto.totalVariantsCalled) : null,
          tiTvRatio: dto.tiTvRatio ? Number(dto.tiTvRatio) : null,
          // Sign-off
          performedBy: dto.performedBy || null, reviewedBy: dto.reviewedBy || null,
          bioinformatician: dto.bioinformatician || null,
          notes: dto.notes || null, runStatus: dto.runStatus || 'library-prep',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.ngsRun.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['runId', 'platform', 'instrumentId', 'instrumentName', 'flowcellId', 'flowcellType',
        'panelName', 'panelVersion', 'enrichmentMethod', 'indexType', 'libraryPrepKit',
        'libraryQcPassed', 'poolingRatio', 'readLength', 'readType', 'runQuality',
        'pipelineName', 'pipelineVersion', 'referenceGenome', 'performedBy', 'reviewedBy',
        'bioinformatician', 'notes', 'runStatus'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['sampleCount', 'fragmentSizeBp', 'libraryConcentration', 'clusterDensity',
        'clustersPfPct', 'q30Pct', 'yieldGb', 'errorRate', 'phasingPct', 'prephasingPct',
        'avgCoverage', 'pctTargetCovered20x', 'totalVariantsCalled', 'tiTvRatio'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.libraryPrepDate) updateData.libraryPrepDate = new Date(dto.libraryPrepDate);
      if (dto.runDate) updateData.runDate = new Date(dto.runDate);
      // Re-assess quality
      if (dto.q30Pct) { const q = Number(dto.q30Pct); updateData.runQuality = q >= 80 ? 'pass' : q >= 70 ? 'marginal' : 'fail'; }
      return await this.prisma.ngsRun.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byStatus, byPlatform] = await Promise.all([
        this.prisma.ngsRun.count({ where: { tenantId } }),
        this.prisma.ngsRun.groupBy({ by: ['runStatus'], where: { tenantId }, _count: true }),
        this.prisma.ngsRun.groupBy({ by: ['platform'], where: { tenantId }, _count: true }),
      ]);
      return { total, byStatus: byStatus.map(s => ({ status: s.runStatus, count: s._count })), byPlatform: byPlatform.map(p => ({ platform: p.platform, count: p._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byStatus: [], byPlatform: [] }; }
  }
}
