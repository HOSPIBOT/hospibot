import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Visual field testing for glaucoma and neuro-ophthalmic disorders
// Humphrey VF (standard automated), Goldmann (kinetic), Octopus
// Test patterns: 24-2, 30-2, 10-2
// Key indices: MD, PSD, VFI
// Reliability: fixation losses, false positives, false negatives

@Injectable()
export class PerimetryService {
  private readonly logger = new Logger(PerimetryService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, testType, eye, search } = query;
      const where: any = { tenantId };
      if (testType) where.testType = testType;
      if (eye) where.eye = eye;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.perimetryTest.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.perimetryTest.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.perimetryTest.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.eye) throw new BadRequestException('Eye required (OD/OS)');
      // Auto-assess reliability
      const fixLoss = dto.fixationLossesPct ? Number(dto.fixationLossesPct) : null;
      const falsePos = dto.falsePositivePct ? Number(dto.falsePositivePct) : null;
      const falseNeg = dto.falseNegativePct ? Number(dto.falseNegativePct) : null;
      let reliable = null;
      if (fixLoss !== null && falsePos !== null && falseNeg !== null) {
        reliable = fixLoss < 20 && falsePos < 15 && falseNeg < 33;
      }
      return await this.prisma.perimetryTest.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null, eye: dto.eye,
          testDate: dto.testDate ? new Date(dto.testDate) : new Date(),
          testType: dto.testType || 'humphrey', testPattern: dto.testPattern || '24-2',
          strategy: dto.strategy || null, deviceName: dto.deviceName || null,
          referringDoctor: dto.referringDoctor || null, clinicalIndication: dto.clinicalIndication || null,
          // Reliability indices
          fixationLossesPct: fixLoss, falsePositivePct: falsePos, falseNegativePct: falseNeg,
          testReliable: reliable, testDurationMin: dto.testDurationMin ? Number(dto.testDurationMin) : null,
          // Global indices
          meanDeviation: dto.meanDeviation ? Number(dto.meanDeviation) : null,
          patternStdDev: dto.patternStdDev ? Number(dto.patternStdDev) : null,
          visualFieldIndex: dto.visualFieldIndex ? Number(dto.visualFieldIndex) : null,
          // Findings
          scotomas: dto.scotomas || null, glaucomaHemifieldTest: dto.glaucomaHemifieldTest || null,
          arcuateDefect: dto.arcuateDefect || false, nasalStep: dto.nasalStep || false,
          paracentral: dto.paracentral || false, generalizedDepression: dto.generalizedDepression || false,
          progressionFromPrior: dto.progressionFromPrior || null,
          interpretation: dto.interpretation || null, interpretedBy: dto.interpretedBy || null,
          notes: dto.notes || null, status: dto.status || 'completed',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.perimetryTest.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'eye', 'testType', 'testPattern', 'strategy', 'deviceName',
        'referringDoctor', 'clinicalIndication', 'testReliable', 'scotomas', 'glaucomaHemifieldTest',
        'arcuateDefect', 'nasalStep', 'paracentral', 'generalizedDepression',
        'progressionFromPrior', 'interpretation', 'interpretedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'fixationLossesPct', 'falsePositivePct', 'falseNegativePct',
        'testDurationMin', 'meanDeviation', 'patternStdDev', 'visualFieldIndex'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.testDate) updateData.testDate = new Date(dto.testDate);
      return await this.prisma.perimetryTest.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, unreliable] = await Promise.all([
        this.prisma.perimetryTest.count({ where: { tenantId } }),
        this.prisma.perimetryTest.groupBy({ by: ['testType'], where: { tenantId }, _count: true }),
        this.prisma.perimetryTest.count({ where: { tenantId, testReliable: false } }),
      ]);
      return { total, unreliableTests: unreliable, byType: byType.map(t => ({ type: t.testType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, unreliableTests: 0, byType: [] }; }
  }
}
