import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// Allergen immunotherapy — SCIT (subcutaneous) / SLIT (sublingual)
// SCIT: build-up (weekly escalation) → maintenance (4-8 wk, 3-5 yr)
// SLIT: daily drops/tablets, safer alternative
// 30-min post-SCIT observation mandatory, anaphylaxis risk ~5%
@Injectable()
export class ImmunotherapyService {
  private readonly logger = new Logger(ImmunotherapyService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, therapyType, phase, search } = query;
      const where: any = { tenantId };
      if(therapyType)where.therapyType=therapyType; if(phase)where.currentPhase=phase;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total] = await Promise.all([this.prisma.immunotherapyPlan.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.immunotherapyPlan.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.immunotherapyPlan.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.therapyType) throw new BadRequestException('Therapy type required (scit/slit-drops/slit-tablet)');
      return await this.prisma.immunotherapyPlan.create({ data: {
        tenantId, patientId: dto.patientId||null, patientName: dto.patientName,
        patientAge: dto.patientAge?Number(dto.patientAge):null, therapyType: dto.therapyType,
        allergenExtract: dto.allergenExtract||null, allergenSource: dto.allergenSource||null,
        startDate: dto.startDate?new Date(dto.startDate):new Date(),
        currentPhase: dto.currentPhase||'build-up',
        buildUpStartDate: dto.buildUpStartDate?new Date(dto.buildUpStartDate):null,
        maintenanceStartDate: dto.maintenanceStartDate?new Date(dto.maintenanceStartDate):null,
        plannedDurationYears: dto.plannedDurationYears?Number(dto.plannedDurationYears):null,
        currentDoseConcentration: dto.currentDoseConcentration||null,
        currentDoseVolumeMl: dto.currentDoseVolumeMl?Number(dto.currentDoseVolumeMl):null,
        injectionIntervalWeeks: dto.injectionIntervalWeeks?Number(dto.injectionIntervalWeeks):null,
        totalSessionsCompleted: dto.totalSessionsCompleted?Number(dto.totalSessionsCompleted):0,
        lastSessionDate: dto.lastSessionDate?new Date(dto.lastSessionDate):null,
        nextSessionDate: dto.nextSessionDate?new Date(dto.nextSessionDate):null,
        observationMinPost: dto.observationMinPost?Number(dto.observationMinPost):30,
        systemicReactionsCount: dto.systemicReactionsCount?Number(dto.systemicReactionsCount):0,
        localReactionsCount: dto.localReactionsCount?Number(dto.localReactionsCount):0,
        symptomScorePre: dto.symptomScorePre?Number(dto.symptomScorePre):null,
        symptomScoreCurrent: dto.symptomScoreCurrent?Number(dto.symptomScoreCurrent):null,
        rescueMedicationReduced: dto.rescueMedicationReduced||null,
        prescribingDoctor: dto.prescribingDoctor||null,
        emergencyKitAvailable: dto.emergencyKitAvailable||false,
        notes: dto.notes||null, status: dto.status||'active', createdBy: userId,
      }});
    } catch (err) { this.logger.error('create', err); throw err; }
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.immunotherapyPlan.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Not found');
      const u: any = {};
      ['patientName','therapyType','allergenExtract','allergenSource','currentPhase','currentDoseConcentration','rescueMedicationReduced','prescribingDoctor','emergencyKitAvailable','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['patientAge','plannedDurationYears','currentDoseVolumeMl','injectionIntervalWeeks','totalSessionsCompleted','observationMinPost','systemicReactionsCount','localReactionsCount','symptomScorePre','symptomScoreCurrent'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['startDate','buildUpStartDate','maintenanceStartDate','lastSessionDate','nextSessionDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.immunotherapyPlan.update({ where: { id }, data: u });
    } catch (err) { this.logger.error('update', err); throw err; }
  }
  async getStats(tenantId: string) {
    try {
      const [total, byType, byPhase] = await Promise.all([this.prisma.immunotherapyPlan.count({where:{tenantId}}),this.prisma.immunotherapyPlan.groupBy({by:['therapyType'],where:{tenantId},_count:true}),this.prisma.immunotherapyPlan.groupBy({by:['currentPhase'],where:{tenantId},_count:true})]);
      return { total, byType: byType.map(t=>({type:t.therapyType,count:t._count})), byPhase: byPhase.map(p=>({phase:p.currentPhase,count:p._count})) };
    } catch { return { total: 0, byType: [], byPhase: [] }; }
  }
}
