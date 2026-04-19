import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// NDPS Act mandatory witness requirement for narcotic seizures
const NDPS_CASE_TYPES = ['ndps'];
// NADA/WADA require A/B sample split
const DOPING_CASE_TYPES = ['nada-doping'];

// Valid status transitions (enforce linear chain — no skipping)
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'collected': ['in-transit', 'received'],
  'in-transit': ['received', 'disputed'],
  'received': ['in-analysis'],
  'in-analysis': ['reported'],
  'reported': ['disposed', 'disputed'],
  'disposed': [],
  'disputed': ['in-analysis', 'reported'],  // can re-enter after dispute resolution
};

@Injectable()
export class CustodyChainService {
  private readonly logger = new Logger(CustodyChainService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LIST ───────────────────────────────────
  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, caseType, search, from, to } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (caseType) where.caseType = caseType;
      if (from || to) {
        where.collectionDate = {};
        if (from) where.collectionDate.gte = new Date(from);
        if (to) where.collectionDate.lte = new Date(to);
      }
      if (search) {
        where.OR = [
          { caseNumber: { contains: search, mode: 'insensitive' } },
          { externalCaseRef: { contains: search, mode: 'insensitive' } },
          { subjectName: { contains: search, mode: 'insensitive' } },
          { collectedBy: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.custodyChain.findMany({
          where,
          include: { handovers: { orderBy: { stepNumber: 'asc' } } },
          orderBy: { collectionDate: 'desc' },
          skip: (page - 1) * limit,
          take: Number(limit),
        }),
        this.prisma.custodyChain.count({ where }),
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
      return await this.prisma.custodyChain.findFirst({
        where: { id, tenantId },
        include: { handovers: { orderBy: { stepNumber: 'asc' } } },
      });
    } catch (err) {
      this.logger.error('findOne error', err);
      return null;
    }
  }

  // ─── CREATE ─────────────────────────────────
  async create(tenantId: string, dto: any, userId: string) {
    try {
      // Regulatory validations
      if (!dto.caseNumber) throw new BadRequestException('Case number is mandatory');
      if (!dto.specimenType) throw new BadRequestException('Specimen type is required');
      if (!dto.collectedBy) throw new BadRequestException('Collector identity is required');
      if (!dto.collectionDate) throw new BadRequestException('Collection date/time is required per NDPS Act S.55');

      // NDPS cases: witness is mandatory per Section 50/55
      if (NDPS_CASE_TYPES.includes(dto.caseType) && !dto.witnessName) {
        throw new BadRequestException(
          'Witness name is mandatory for NDPS cases per Section 50/55 of the NDPS Act 1985'
        );
      }

      // NADA/WADA: A/B sample split seal numbers mandatory
      if (DOPING_CASE_TYPES.includes(dto.caseType)) {
        if (!dto.sealNumberA) {
          throw new BadRequestException('A-sample seal number is mandatory for NADA/WADA doping control');
        }
        if (!dto.sealNumberB) {
          throw new BadRequestException('B-sample seal number is mandatory per WADA Code — A/B split required');
        }
      }

      // Auto-generate case number if not provided
      const caseNumber = dto.caseNumber || `COC-${Date.now()}`;

      return await this.prisma.custodyChain.create({
        data: {
          tenantId,
          caseNumber,
          externalCaseRef: dto.externalCaseRef || null,
          caseType: dto.caseType,
          priority: dto.priority || 'routine',
          specimenType: dto.specimenType,
          specimenDesc: dto.specimenDesc || null,
          containerType: dto.containerType || null,
          sealNumberA: dto.sealNumberA || null,
          sealNumberB: dto.sealNumberB || null,
          quantity: dto.quantity || null,
          specimenCount: dto.specimenCount || 1,
          collectedBy: dto.collectedBy,
          collectorRole: dto.collectorRole || null,
          collectorId: dto.collectorId || null,
          collectionDate: new Date(dto.collectionDate),
          collectionTime: dto.collectionTime || null,
          collectionLocation: dto.collectionLocation || null,
          subjectName: dto.subjectName || null,
          subjectId: dto.subjectId || null,
          subjectGender: dto.subjectGender || null,
          subjectDob: dto.subjectDob || null,
          witnessName: dto.witnessName || null,
          witnessId: dto.witnessId || null,
          witnessSignature: dto.witnessSignature || false,
          notes: dto.notes || null,
          status: 'collected',
          createdBy: userId,
        },
        include: { handovers: true },
      });
    } catch (err) {
      this.logger.error('create error', err);
      throw err;
    }
  }

  // ─── UPDATE (only draft/pre-analysis fields) ─
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.custodyChain.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Custody chain not found');

      // Cannot modify after reporting (immutability for legal evidence)
      if (['reported', 'disposed'].includes(existing.status)) {
        throw new BadRequestException(
          'Cannot modify a reported/disposed custody record. This record is legally sealed. File a dispute instead.'
        );
      }

      return await this.prisma.custodyChain.update({
        where: { id },
        data: {
          ...(dto.externalCaseRef !== undefined && { externalCaseRef: dto.externalCaseRef }),
          ...(dto.priority && { priority: dto.priority }),
          ...(dto.specimenDesc !== undefined && { specimenDesc: dto.specimenDesc }),
          ...(dto.containerType !== undefined && { containerType: dto.containerType }),
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.storageCondition !== undefined && { storageCondition: dto.storageCondition }),
          ...(dto.storageLocation !== undefined && { storageLocation: dto.storageLocation }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          // Analysis fields (set when lab processes)
          ...(dto.analysisMethod !== undefined && { analysisMethod: dto.analysisMethod }),
          ...(dto.analysisByName !== undefined && { analysisByName: dto.analysisByName }),
          ...(dto.analysisById !== undefined && { analysisById: dto.analysisById }),
          ...(dto.analysisDate && { analysisDate: new Date(dto.analysisDate) }),
          ...(dto.instrumentId !== undefined && { instrumentId: dto.instrumentId }),
          ...(dto.resultSummary !== undefined && { resultSummary: dto.resultSummary }),
          ...(dto.reportNumber !== undefined && { reportNumber: dto.reportNumber }),
          ...(dto.reportDate && { reportDate: new Date(dto.reportDate) }),
          // Disposal
          ...(dto.disposalMethod !== undefined && { disposalMethod: dto.disposalMethod }),
          ...(dto.disposalDate && { disposalDate: new Date(dto.disposalDate) }),
          ...(dto.disposalWitness !== undefined && { disposalWitness: dto.disposalWitness }),
          ...(dto.disposalAuth !== undefined && { disposalAuth: dto.disposalAuth }),
        },
        include: { handovers: { orderBy: { stepNumber: 'asc' } } },
      });
    } catch (err) {
      this.logger.error('update error', err);
      throw err;
    }
  }

  // ─── TRANSITION STATUS ──────────────────────
  async transitionStatus(tenantId: string, id: string, newStatus: string, userId: string) {
    try {
      const existing = await this.prisma.custodyChain.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Custody chain not found');

      const allowed = STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from "${existing.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`
        );
      }

      const updateData: any = { status: newStatus };

      // Auto-set timestamps based on transition
      if (newStatus === 'received') {
        updateData.receivedAt = new Date();
        updateData.receivedBy = userId;
      }

      return await this.prisma.custodyChain.update({
        where: { id },
        data: updateData,
        include: { handovers: { orderBy: { stepNumber: 'asc' } } },
      });
    } catch (err) {
      this.logger.error('transitionStatus error', err);
      throw err;
    }
  }

  // ─── ADD HANDOVER STEP ──────────────────────
  async addHandover(tenantId: string, chainId: string, dto: any, userId: string) {
    try {
      const chain = await this.prisma.custodyChain.findFirst({
        where: { id: chainId, tenantId },
        include: { handovers: { orderBy: { stepNumber: 'desc' }, take: 1 } },
      });
      if (!chain) throw new BadRequestException('Custody chain not found');

      if (['reported', 'disposed'].includes(chain.status)) {
        throw new BadRequestException('Cannot add handover to a reported/disposed chain');
      }

      if (!dto.fromName || !dto.toName) {
        throw new BadRequestException('Both "from" and "to" identities are required per chain of custody protocol');
      }

      // Seal integrity check — if seal is broken, flag the chain
      if (dto.sealIntact === false) {
        await this.prisma.custodyChain.update({
          where: { id: chainId },
          data: {
            integrityBreach: true,
            breachNotes: `Seal breach detected at step ${(chain.handovers[0]?.stepNumber || 0) + 1}: ${dto.conditionNotes || 'No details provided'}`,
          },
        });
      }

      const nextStep = (chain.handovers[0]?.stepNumber || 0) + 1;

      return await this.prisma.custodyHandover.create({
        data: {
          chainId,
          stepNumber: nextStep,
          fromName: dto.fromName,
          fromRole: dto.fromRole || null,
          fromId: dto.fromId || null,
          toName: dto.toName,
          toRole: dto.toRole || null,
          toId: dto.toId || null,
          handoverDate: new Date(dto.handoverDate),
          handoverTime: dto.handoverTime || null,
          location: dto.location || null,
          sealIntact: dto.sealIntact !== false,
          conditionNotes: dto.conditionNotes || null,
          transportMode: dto.transportMode || null,
          tempRecorded: dto.tempRecorded || null,
          fromConfirmed: dto.fromConfirmed || false,
          toConfirmed: dto.toConfirmed || false,
          createdBy: userId,
        },
      });
    } catch (err) {
      this.logger.error('addHandover error', err);
      throw err;
    }
  }

  // ─── RECEIVE AT LAB ─────────────────────────
  async receiveAtLab(tenantId: string, id: string, dto: any, userId: string) {
    try {
      const chain = await this.prisma.custodyChain.findFirst({ where: { id, tenantId } });
      if (!chain) throw new BadRequestException('Custody chain not found');

      return await this.prisma.custodyChain.update({
        where: { id },
        data: {
          status: 'received',
          receivedAt: new Date(),
          receivedBy: dto.receivedBy || userId,
          sealIntactOnReceipt: dto.sealIntact !== false,
          storageCondition: dto.storageCondition || null,
          storageLocation: dto.storageLocation || null,
          ...(dto.sealIntact === false && {
            integrityBreach: true,
            breachNotes: `Seal NOT intact on lab receipt: ${dto.conditionNotes || ''}`,
          }),
        },
        include: { handovers: { orderBy: { stepNumber: 'asc' } } },
      });
    } catch (err) {
      this.logger.error('receiveAtLab error', err);
      throw err;
    }
  }

  // ─── INTEGRITY REPORT ───────────────────────
  async getIntegrityReport(tenantId: string, query: any) {
    try {
      const { from, to } = query;
      const where: any = { tenantId };
      if (from || to) {
        where.collectionDate = {};
        if (from) where.collectionDate.gte = new Date(from);
        if (to) where.collectionDate.lte = new Date(to);
      }

      const [total, breaches, byType, byStatus] = await Promise.all([
        this.prisma.custodyChain.count({ where }),
        this.prisma.custodyChain.count({ where: { ...where, integrityBreach: true } }),
        this.prisma.custodyChain.groupBy({
          by: ['caseType'],
          where,
          _count: true,
        }),
        this.prisma.custodyChain.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        breaches,
        integrityRate: total > 0 ? Math.round(((total - breaches) / total) * 100) : 100,
        byType: byType.map(t => ({ type: t.caseType, count: t._count })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      };
    } catch (err) {
      this.logger.error('getIntegrityReport error', err);
      return { total: 0, breaches: 0, integrityRate: 100, byType: [], byStatus: [] };
    }
  }
}
