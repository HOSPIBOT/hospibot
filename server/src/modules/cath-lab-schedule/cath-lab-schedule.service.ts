import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// SCAI Expert Consensus on CCL Best Practices (endorsed by CSI)
// Door-to-balloon target: <90 min for STEMI
// Pre-procedure checklist mandatory
// Consumable tracking: stents, catheters, guidewires, balloons

@Injectable()
export class CathLabScheduleService {
  private readonly logger = new Logger(CathLabScheduleService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, procedureType, status, cardiologist, search } = query;
      const where: any = { tenantId };
      if (procedureType) where.procedureType = procedureType;
      if (status) where.status = status;
      if (cardiologist) where.cardiologist = cardiologist;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.cathLabSchedule.findMany({ where, orderBy: { scheduledDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.cathLabSchedule.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.cathLabSchedule.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.procedureType) throw new BadRequestException('Procedure type required');

      // Door-to-balloon tracking for STEMI PCI
      let doorToBalloonMin = null;
      if (dto.procedureType === 'primary-pci' && dto.doorTime && dto.balloonTime) {
        const door = new Date(dto.doorTime).getTime();
        const balloon = new Date(dto.balloonTime).getTime();
        doorToBalloonMin = Math.round((balloon - door) / 60000);
      }

      return await this.prisma.cathLabSchedule.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null,
          patientGender: dto.patientGender || null,
          procedureType: dto.procedureType,
          indication: dto.indication || null, diagnosis: dto.diagnosis || null,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : new Date(),
          scheduledSlot: dto.scheduledSlot || null,
          labRoom: dto.labRoom || null,
          cardiologist: dto.cardiologist || null, assistantDoctor: dto.assistantDoctor || null,
          scrubNurse: dto.scrubNurse || null, technicianName: dto.technicianName || null,
          anesthesiologist: dto.anesthesiologist || null,
          // Pre-procedure checklist (SCAI)
          consentSigned: dto.consentSigned || false,
          labWorkDone: dto.labWorkDone || false,
          creatinine: dto.creatinine ? Number(dto.creatinine) : null,
          inr: dto.inr ? Number(dto.inr) : null,
          hb: dto.hb ? Number(dto.hb) : null,
          bloodGroupConfirmed: dto.bloodGroupConfirmed || false,
          npoStatus: dto.npoStatus || null,
          allergies: dto.allergies || null,
          accessSite: dto.accessSite || 'radial',
          sheathSize: dto.sheathSize || null,
          // Consumables used
          stentUsed: dto.stentUsed || null, stentSize: dto.stentSize || null,
          stentBrand: dto.stentBrand || null, stentLotNumber: dto.stentLotNumber || null,
          balloonUsed: dto.balloonUsed || null, balloonSize: dto.balloonSize || null,
          guidewireUsed: dto.guidewireUsed || null,
          catheterUsed: dto.catheterUsed || null,
          contrastUsed: dto.contrastUsed || null,
          contrastVolumeMl: dto.contrastVolumeMl ? Number(dto.contrastVolumeMl) : null,
          fluoroTimeMin: dto.fluoroTimeMin ? Number(dto.fluoroTimeMin) : null,
          radiationDoseMgy: dto.radiationDoseMgy ? Number(dto.radiationDoseMgy) : null,
          // Timing
          doorTime: dto.doorTime ? new Date(dto.doorTime) : null,
          balloonTime: dto.balloonTime ? new Date(dto.balloonTime) : null,
          doorToBalloonMin: doorToBalloonMin,
          procedureStart: dto.procedureStart ? new Date(dto.procedureStart) : null,
          procedureEnd: dto.procedureEnd ? new Date(dto.procedureEnd) : null,
          // Outcome
          outcome: dto.outcome || null, complications: dto.complications || null,
          postProcedurePlan: dto.postProcedurePlan || null,
          dischargeDate: dto.dischargeDate ? new Date(dto.dischargeDate) : null,
          notes: dto.notes || null, status: dto.status || 'scheduled',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.cathLabSchedule.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'procedureType', 'indication', 'diagnosis',
        'scheduledSlot', 'labRoom', 'cardiologist', 'assistantDoctor', 'scrubNurse', 'technicianName',
        'anesthesiologist', 'consentSigned', 'labWorkDone', 'bloodGroupConfirmed', 'npoStatus',
        'allergies', 'accessSite', 'sheathSize', 'stentUsed', 'stentSize', 'stentBrand',
        'stentLotNumber', 'balloonUsed', 'balloonSize', 'guidewireUsed', 'catheterUsed',
        'contrastUsed', 'outcome', 'complications', 'postProcedurePlan', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'creatinine', 'inr', 'hb', 'contrastVolumeMl', 'fluoroTimeMin', 'radiationDoseMgy', 'doorToBalloonMin'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      const dateFields = ['scheduledDate', 'doorTime', 'balloonTime', 'procedureStart', 'procedureEnd', 'dischargeDate'];
      for (const f of dateFields) { if (dto[f]) updateData[f] = new Date(dto[f]); }
      return await this.prisma.cathLabSchedule.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType, byOutcome] = await Promise.all([
        this.prisma.cathLabSchedule.count({ where: { tenantId } }),
        this.prisma.cathLabSchedule.groupBy({ by: ['procedureType'], where: { tenantId }, _count: true }),
        this.prisma.cathLabSchedule.groupBy({ by: ['outcome'], where: { tenantId }, _count: true }),
      ]);
      return { total, byType: byType.map(t => ({ type: t.procedureType, count: t._count })), byOutcome: byOutcome.filter(o => o.outcome).map(o => ({ outcome: o.outcome, count: o._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [], byOutcome: [] }; }
  }
}
