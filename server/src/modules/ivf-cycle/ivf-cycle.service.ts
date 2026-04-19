import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ART Act 2021 — maximum embryos to transfer (ICMR/ISAR guidelines)
const MAX_EMBRYO_TRANSFER: Record<string, number> = {
  'under-35': 2,   // max 2 for women under 35
  '35-39': 3,      // max 3 for 35-39
  '40-plus': 3,    // max 3 for 40+
  'donor-egg': 2,  // max 2 for donor egg cycles
};

// Valid status transitions
const STATUS_FLOW: Record<string, string[]> = {
  'initiated': ['stimulating', 'cancelled'],
  'stimulating': ['triggered', 'cancelled'],
  'triggered': ['opu-done', 'cancelled'],
  'opu-done': ['fertilized', 'cancelled'],
  'fertilized': ['culturing'],
  'culturing': ['transferred', 'frozen-all', 'cancelled'],
  'transferred': ['outcome-pending'],
  'frozen-all': ['completed'],
  'outcome-pending': ['completed'],
  'completed': [],
  'cancelled': [],
};

@Injectable()
export class IvfCycleService {
  private readonly logger = new Logger(IvfCycleService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LIST ───────────────────────────────────
  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, cycleType, search, from, to } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (cycleType) where.cycleType = cycleType;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }
      if (search) {
        where.OR = [
          { cycleNumber: { contains: search, mode: 'insensitive' } },
          { patientName: { contains: search, mode: 'insensitive' } },
          { partnerName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.ivfCycle.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: Number(limit),
        }),
        this.prisma.ivfCycle.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) {
      this.logger.error('findAll error', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  }

  // ─── GET ONE ────────────────────────────────
  async findOne(tenantId: string, id: string) {
    try {
      return await this.prisma.ivfCycle.findFirst({ where: { id, tenantId } });
    } catch (err) {
      this.logger.error('findOne error', err);
      return null;
    }
  }

  // ─── CREATE ─────────────────────────────────
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.cycleType) throw new BadRequestException('Cycle type is required');

      // ART Act 2021: Form D consent is mandatory before starting
      if (!dto.consentFormD) {
        throw new BadRequestException(
          'ICMR Form D consent must be signed before initiating an IVF cycle (ART Act 2021, Section 21)'
        );
      }

      return await this.prisma.ivfCycle.create({
        data: {
          tenantId,
          cycleNumber: dto.cycleNumber || `IVF-${Date.now().toString(36).toUpperCase()}`,
          patientId: dto.patientId || null,
          patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          partnerName: dto.partnerName || null,
          partnerAge: dto.partnerAge ? Number(dto.partnerAge) : null,
          cycleType: dto.cycleType,
          stimProtocol: dto.stimProtocol || null,
          indication: dto.indication || null,
          consentFormD: true,
          consentDate: dto.consentDate ? new Date(dto.consentDate) : new Date(),
          consentCryoDisposal: dto.consentCryoDisposal || null,
          notes: dto.notes || null,
          status: 'initiated',
          createdBy: userId,
        },
      });
    } catch (err) {
      this.logger.error('create error', err);
      throw err;
    }
  }

  // ─── UPDATE (stage-specific fields) ─────────
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.ivfCycle.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('IVF cycle not found');
      if (existing.status === 'completed' || existing.status === 'cancelled') {
        throw new BadRequestException('Cannot modify a completed/cancelled cycle');
      }

      // Transfer validation: max embryo count per ART Act guidelines
      if (dto.embryosTransferred !== undefined) {
        const ageGroup = (existing.patientAge || 30) < 35 ? 'under-35' :
          (existing.patientAge || 30) <= 39 ? '35-39' : '40-plus';
        const key = existing.cycleType === 'donor-egg' ? 'donor-egg' : ageGroup;
        const maxTransfer = MAX_EMBRYO_TRANSFER[key] || 3;
        if (Number(dto.embryosTransferred) > maxTransfer) {
          throw new BadRequestException(
            `ART Act / ICMR guidelines limit transfer to ${maxTransfer} embryos for this patient category (${key}). Requested: ${dto.embryosTransferred}`
          );
        }
      }

      // Auto-calculate fertilization rate
      let fertRate = existing.fertRate;
      if (dto.fertNormal2pn !== undefined && existing.oocytesMature) {
        fertRate = Math.round((Number(dto.fertNormal2pn) / existing.oocytesMature) * 100 * 10) / 10;
      }

      const updateData: any = {};
      // Map all provided fields (only set if defined in dto)
      const directFields = [
        'stimProtocol', 'indication', 'stimDays', 'triggerDrug', 'triggerDose',
        'opuEmbryologist', 'oocytesTotal', 'oocytesMature', 'oocytesImmature', 'oocytesDegen',
        'spermSource', 'inseminationMethod',
        'fertNormal2pn', 'fertAbnormal', 'fertUnfert',
        'transferDay', 'embryosTransferred', 'transferGrades', 'transferDifficulty',
        'transferEmbryologist', 'transferPhysician',
        'embryosFrozen', 'freezeMethod', 'cryoStorageId',
        'bhcgPositive', 'clinicalPregnancy', 'fetalHeartbeat', 'gestationCount',
        'outcome', 'ohssGrade', 'complications', 'cancelReason', 'notes',
        'consentCryoDisposal', 'artRegistryId',
      ];
      for (const field of directFields) {
        if (dto[field] !== undefined) updateData[field] = dto[field];
      }
      // Numeric fields
      const numFields = ['oocytesTotal', 'oocytesMature', 'oocytesImmature', 'oocytesDegen',
        'fertNormal2pn', 'fertAbnormal', 'fertUnfert', 'transferDay', 'embryosTransferred',
        'embryosFrozen', 'gestationCount', 'stimDays', 'patientAge', 'partnerAge'];
      for (const f of numFields) {
        if (updateData[f] !== undefined) updateData[f] = Number(updateData[f]);
      }
      // Float fields
      const floatFields = ['spermCountMil', 'spermMotility', 'spermMorphology', 'bhcgValue', 'birthWeight'];
      for (const f of floatFields) {
        if (dto[f] !== undefined) updateData[f] = Number(dto[f]);
      }
      // Date fields
      const dateFields = ['stimStartDate', 'triggerDate', 'opuDate', 'inseminationDate',
        'fertCheckDate', 'transferDate', 'bhcgDate', 'liveBirthDate'];
      for (const f of dateFields) {
        if (dto[f]) updateData[f] = new Date(dto[f]);
      }
      // JSON fields
      if (dto.stimDrugs) updateData.stimDrugs = dto.stimDrugs;
      if (dto.monitoringLogs) updateData.monitoringLogs = dto.monitoringLogs;
      if (dto.embryoGrades) updateData.embryoGrades = dto.embryoGrades;

      if (fertRate !== existing.fertRate) updateData.fertRate = fertRate;

      return await this.prisma.ivfCycle.update({
        where: { id },
        data: updateData,
      });
    } catch (err) {
      this.logger.error('update error', err);
      throw err;
    }
  }

  // ─── TRANSITION STATUS ──────────────────────
  async transitionStatus(tenantId: string, id: string, newStatus: string, userId: string) {
    try {
      const existing = await this.prisma.ivfCycle.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('IVF cycle not found');

      const allowed = STATUS_FLOW[existing.status] || [];
      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from "${existing.status}" to "${newStatus}". Allowed: ${allowed.join(', ')}`
        );
      }

      return await this.prisma.ivfCycle.update({
        where: { id },
        data: { status: newStatus, ...(newStatus === 'cancelled' ? { cancelReason: 'Cycle cancelled' } : {}) },
      });
    } catch (err) {
      this.logger.error('transitionStatus error', err);
      throw err;
    }
  }

  // ─── OUTCOME STATS ──────────────────────────
  async getOutcomeStats(tenantId: string, query: any) {
    try {
      const { from, to } = query;
      const where: any = { tenantId, status: 'completed' };
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const cycles = await this.prisma.ivfCycle.findMany({ where });
      const total = cycles.length;
      const transferred = cycles.filter(c => c.embryosTransferred && c.embryosTransferred > 0).length;
      const bhcgPos = cycles.filter(c => c.bhcgPositive).length;
      const clinical = cycles.filter(c => c.clinicalPregnancy).length;
      const liveBirth = cycles.filter(c => c.outcome === 'live-birth').length;
      const cancelled = await this.prisma.ivfCycle.count({ where: { tenantId, status: 'cancelled' } });

      return {
        totalCompleted: total,
        totalCancelled: cancelled,
        transferred,
        bhcgPositiveRate: transferred > 0 ? Math.round((bhcgPos / transferred) * 100) : 0,
        clinicalPregnancyRate: transferred > 0 ? Math.round((clinical / transferred) * 100) : 0,
        liveBirthRate: transferred > 0 ? Math.round((liveBirth / transferred) * 100) : 0,
        avgOocytes: total > 0 ? Math.round(cycles.reduce((s, c) => s + (c.oocytesTotal || 0), 0) / total) : 0,
        avgFertRate: total > 0 ? Math.round(cycles.reduce((s, c) => s + (c.fertRate || 0), 0) / total * 10) / 10 : 0,
      };
    } catch (err) {
      this.logger.error('getOutcomeStats error', err);
      return { totalCompleted: 0, totalCancelled: 0, transferred: 0, bhcgPositiveRate: 0, clinicalPregnancyRate: 0, liveBirthRate: 0 };
    }
  }
}
