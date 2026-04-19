import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// AERB Safety Code SC-2 (Rev.2) — Nuclear Medicine
const TRACER_DB: Record<string, { halfLifeMin: number; maxMBq: number; route: string }> = {
  'F-18 FDG': { halfLifeMin: 109.8, maxMBq: 400, route: 'IV' },
  'Tc-99m Pertechnetate': { halfLifeMin: 360.6, maxMBq: 1110, route: 'IV' },
  'Tc-99m MDP': { halfLifeMin: 360.6, maxMBq: 925, route: 'IV' },
  'Tc-99m MIBI': { halfLifeMin: 360.6, maxMBq: 1110, route: 'IV' },
  'Tc-99m DTPA': { halfLifeMin: 360.6, maxMBq: 370, route: 'IV' },
  'Tc-99m MAA': { halfLifeMin: 360.6, maxMBq: 185, route: 'IV' },
  'Tc-99m DMSA': { halfLifeMin: 360.6, maxMBq: 185, route: 'IV' },
  'Tc-99m Sulfur Colloid': { halfLifeMin: 360.6, maxMBq: 370, route: 'IV' },
  'I-131 Sodium Iodide': { halfLifeMin: 11563, maxMBq: 7400, route: 'Oral' },
  'I-123 Sodium Iodide': { halfLifeMin: 793, maxMBq: 37, route: 'Oral' },
  'Ga-67 Citrate': { halfLifeMin: 4687, maxMBq: 370, route: 'IV' },
  'Tl-201 Chloride': { halfLifeMin: 4382, maxMBq: 148, route: 'IV' },
  'Ga-68 DOTATATE': { halfLifeMin: 67.7, maxMBq: 200, route: 'IV' },
  'Lu-177 DOTATATE': { halfLifeMin: 9648, maxMBq: 7400, route: 'IV' },
  'F-18 NaF': { halfLifeMin: 109.8, maxMBq: 370, route: 'IV' },
};

@Injectable()
export class RadiotracerLogService {
  private readonly logger = new Logger(RadiotracerLogService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, tracerName, status, search } = query;
      const where: any = { tenantId };
      if (tracerName) where.tracerName = tracerName;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }, { batchNumber: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.radiotracerLog.findMany({ where, orderBy: { administrationDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.radiotracerLog.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.radiotracerLog.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.tracerName) throw new BadRequestException('Radiotracer name is required');
      if (!dto.patientName) throw new BadRequestException('Patient name is required');
      if (!dto.batchNumber) throw new BadRequestException('Batch number is mandatory per AERB SC-2');

      const info = TRACER_DB[dto.tracerName];
      const halfLife = info?.halfLifeMin || (dto.halfLifeMinutes ? Number(dto.halfLifeMinutes) : null);
      const doseMbq = dto.administeredDoseMbq ? Number(dto.administeredDoseMbq) : null;

      // AERB dose limit check
      if (info && doseMbq && doseMbq > info.maxMBq) {
        throw new BadRequestException(`Dose ${doseMbq} MBq exceeds AERB max ${info.maxMBq} MBq for ${dto.tracerName}`);
      }

      // Decay calculation: activity at administration from calibration
      let decayedActivityMbq = null;
      if (dto.calibrationActivityMbq && dto.calibrationTime && dto.administrationTime && halfLife) {
        const elapsed = (new Date(dto.administrationTime).getTime() - new Date(dto.calibrationTime).getTime()) / 60000;
        decayedActivityMbq = Math.round(Number(dto.calibrationActivityMbq) * Math.pow(0.5, elapsed / halfLife) * 100) / 100;
      }

      return await this.prisma.radiotracerLog.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientWeight: dto.patientWeight ? Number(dto.patientWeight) : null,
          tracerName: dto.tracerName, radioisotope: dto.radioisotope || dto.tracerName?.split(' ')[0] || null,
          halfLifeMinutes: halfLife, routeOfAdmin: info?.route || dto.routeOfAdmin || null,
          batchNumber: dto.batchNumber, supplierName: dto.supplierName || null,
          receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : null,
          receivedActivityMbq: dto.receivedActivityMbq ? Number(dto.receivedActivityMbq) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          calibrationActivityMbq: dto.calibrationActivityMbq ? Number(dto.calibrationActivityMbq) : null,
          calibrationTime: dto.calibrationTime ? new Date(dto.calibrationTime) : null,
          administrationDate: dto.administrationDate ? new Date(dto.administrationDate) : new Date(),
          administrationTime: dto.administrationTime ? new Date(dto.administrationTime) : null,
          administeredDoseMbq: doseMbq, decayedActivityMbq: decayedActivityMbq,
          residualInSyringeMbq: dto.residualInSyringeMbq ? Number(dto.residualInSyringeMbq) : null,
          doseCalibrator: dto.doseCalibrator || null, doseCalibSerialNo: dto.doseCalibSerialNo || null,
          eloraLicenseNo: dto.eloraLicenseNo || null,
          rsoVerified: dto.rsoVerified || false, rsoName: dto.rsoName || null,
          wasteDisposalMethod: dto.wasteDisposalMethod || null,
          wasteActivityMbq: dto.wasteActivityMbq ? Number(dto.wasteActivityMbq) : null,
          indication: dto.indication || null, scanType: dto.scanType || null,
          adverseReaction: dto.adverseReaction || null,
          nuclearPhysician: dto.nuclearPhysician || null, technicianName: dto.technicianName || null,
          pregnancyScreened: dto.pregnancyScreened || false,
          breastfeedingStatus: dto.breastfeedingStatus || null,
          notes: dto.notes || null, status: dto.status || 'administered',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.radiotracerLog.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'tracerName', 'radioisotope', 'routeOfAdmin', 'batchNumber',
        'supplierName', 'doseCalibrator', 'doseCalibSerialNo', 'eloraLicenseNo',
        'rsoVerified', 'rsoName', 'wasteDisposalMethod', 'indication', 'scanType',
        'adverseReaction', 'nuclearPhysician', 'technicianName', 'pregnancyScreened',
        'breastfeedingStatus', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'patientWeight', 'halfLifeMinutes', 'receivedActivityMbq',
        'calibrationActivityMbq', 'administeredDoseMbq', 'decayedActivityMbq',
        'residualInSyringeMbq', 'wasteActivityMbq'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['receivedDate', 'expiryDate', 'administrationDate', 'calibrationTime', 'administrationTime'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.radiotracerLog.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byTracer, adverse] = await Promise.all([
        this.prisma.radiotracerLog.count({ where: { tenantId } }),
        this.prisma.radiotracerLog.groupBy({ by: ['tracerName'], where: { tenantId }, _count: true }),
        this.prisma.radiotracerLog.count({ where: { tenantId, adverseReaction: { not: null } } }),
      ]);
      return { total, adverseReactions: adverse, byTracer: byTracer.map(t => ({ tracer: t.tracerName, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, adverseReactions: 0, byTracer: [] }; }
  }
}
