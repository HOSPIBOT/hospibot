import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// Allergen panel testing — SPT (gold standard aeroallergens), specific IgE, CRD
// Platforms: ImmunoCAP, ALEX, FABER | Wheal ≥3mm = positive SPT
// Panel categories: food, inhalant, animal dander, insect, mold, pollen
// Anaphylaxis emergency kit mandatory per WAO guidelines
@Injectable()
export class AllergenPanelsService {
  private readonly logger = new Logger(AllergenPanelsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, testMethod, status, search } = query;
      const where: any = { tenantId };
      if (testMethod) where.testMethod = testMethod;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([this.prisma.allergenPanel.findMany({ where, orderBy: { testDate: 'desc' }, skip: (page-1)*limit, take: Number(limit) }), this.prisma.allergenPanel.count({ where })]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.allergenPanel.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.testMethod) throw new BadRequestException('Test method required (spt/specific-ige/crd/intradermal/patch)');
      return await this.prisma.allergenPanel.create({ data: {
        tenantId, patientId: dto.patientId||null, patientName: dto.patientName,
        patientAge: dto.patientAge?Number(dto.patientAge):null, patientGender: dto.patientGender||null,
        testDate: dto.testDate?new Date(dto.testDate):new Date(), testMethod: dto.testMethod,
        panelCategory: dto.panelCategory||null, panelName: dto.panelName||null,
        platform: dto.platform||null, referringDoctor: dto.referringDoctor||null,
        clinicalIndication: dto.clinicalIndication||null,
        medicationsStoppedDays: dto.medicationsStoppedDays?Number(dto.medicationsStoppedDays):null,
        antihistaminesStopped: dto.antihistaminesStopped||false,
        totalIge: dto.totalIge?Number(dto.totalIge):null,
        allergensTestedCount: dto.allergensTestedCount?Number(dto.allergensTestedCount):null,
        positiveCount: dto.positiveCount?Number(dto.positiveCount):null,
        allergenResults: dto.allergenResults||null,
        positiveControlValid: dto.positiveControlValid||null,
        negativeControlValid: dto.negativeControlValid||null,
        anaphylaxisKitPresent: dto.anaphylaxisKitPresent||false,
        adverseReaction: dto.adverseReaction||false, adverseReactionDetail: dto.adverseReactionDetail||null,
        interpretation: dto.interpretation||null, recommendations: dto.recommendations||null,
        immunotherapyRecommended: dto.immunotherapyRecommended||false,
        performedBy: dto.performedBy||null, interpretedBy: dto.interpretedBy||null,
        notes: dto.notes||null, status: dto.status||'completed', createdBy: userId,
      }});
    } catch (err) { this.logger.error('create', err); throw err; }
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.allergenPanel.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Not found');
      const u: any = {};
      ['patientName','patientGender','testMethod','panelCategory','panelName','platform','referringDoctor','clinicalIndication','antihistaminesStopped','positiveControlValid','negativeControlValid','anaphylaxisKitPresent','adverseReaction','adverseReactionDetail','interpretation','recommendations','immunotherapyRecommended','performedBy','interpretedBy','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['patientAge','medicationsStoppedDays','totalIge','allergensTestedCount','positiveCount'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      if(dto.testDate)u.testDate=new Date(dto.testDate);
      if(dto.allergenResults)u.allergenResults=dto.allergenResults;
      return await this.prisma.allergenPanel.update({ where: { id }, data: u });
    } catch (err) { this.logger.error('update', err); throw err; }
  }
  async getStats(tenantId: string) {
    try {
      const [total, byMethod] = await Promise.all([this.prisma.allergenPanel.count({ where: { tenantId } }), this.prisma.allergenPanel.groupBy({ by: ['testMethod'], where: { tenantId }, _count: true })]);
      return { total, byMethod: byMethod.map(m=>({method:m.testMethod,count:m._count})) };
    } catch { return { total: 0, byMethod: [] }; }
  }
}
