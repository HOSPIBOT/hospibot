import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// Urodynamic studies — ICS standards
// Tests: uroflowmetry, cystometry, pressure-flow, EMG
// Key metrics: Qmax, voided volume, PVR, detrusor pressure, compliance
@Injectable()
export class UrodynamicsService {
  private readonly logger = new Logger(UrodynamicsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, studyType, status, search } = query;
      const where: any = { tenantId }; if(studyType)where.studyType=studyType; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.urodynamicStudy.findMany({where,orderBy:{studyDate:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.urodynamicStudy.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.urodynamicStudy.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.patientName)throw new BadRequestException('Patient name required');
      return await this.prisma.urodynamicStudy.create({ data: {
        tenantId, patientId:dto.patientId||null, patientName:dto.patientName,
        patientAge:dto.patientAge?Number(dto.patientAge):null, patientGender:dto.patientGender||null,
        studyDate:dto.studyDate?new Date(dto.studyDate):new Date(), studyType:dto.studyType||'comprehensive',
        referringDoctor:dto.referringDoctor||null, clinicalIndication:dto.clinicalIndication||null,
        // Uroflowmetry
        qmax:dto.qmax?Number(dto.qmax):null, qavg:dto.qavg?Number(dto.qavg):null,
        voidedVolumeMl:dto.voidedVolumeMl?Number(dto.voidedVolumeMl):null,
        flowTimeSec:dto.flowTimeSec?Number(dto.flowTimeSec):null,
        flowPattern:dto.flowPattern||null,
        // PVR
        postVoidResidualMl:dto.postVoidResidualMl?Number(dto.postVoidResidualMl):null,
        // Cystometry
        firstSensationMl:dto.firstSensationMl?Number(dto.firstSensationMl):null,
        normalDesireMl:dto.normalDesireMl?Number(dto.normalDesireMl):null,
        strongDesireMl:dto.strongDesireMl?Number(dto.strongDesireMl):null,
        maxCystometricCapacityMl:dto.maxCystometricCapacityMl?Number(dto.maxCystometricCapacityMl):null,
        complianceMlCmH2O:dto.complianceMlCmH2O?Number(dto.complianceMlCmH2O):null,
        detrusorOveractivity:dto.detrusorOveractivity||false,
        // Pressure-flow
        detrusorPressureAtQmax:dto.detrusorPressureAtQmax?Number(dto.detrusorPressureAtQmax):null,
        bladderOutletObstruction:dto.bladderOutletObstruction||null,
        booiIndex:dto.booiIndex?Number(dto.booiIndex):null,
        // EMG
        emgPerformed:dto.emgPerformed||false, emgFindings:dto.emgFindings||null,
        // Results
        diagnosis:dto.diagnosis||null, findings:dto.findings||null,
        performedBy:dto.performedBy||null, interpretedBy:dto.interpretedBy||null,
        notes:dto.notes||null, status:dto.status||'completed', createdBy:userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.urodynamicStudy.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['patientName','patientGender','studyType','referringDoctor','clinicalIndication','flowPattern','detrusorOveractivity','bladderOutletObstruction','emgPerformed','emgFindings','diagnosis','findings','performedBy','interpretedBy','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['patientAge','qmax','qavg','voidedVolumeMl','flowTimeSec','postVoidResidualMl','firstSensationMl','normalDesireMl','strongDesireMl','maxCystometricCapacityMl','complianceMlCmH2O','detrusorPressureAtQmax','booiIndex'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      if(dto.studyDate)u.studyDate=new Date(dto.studyDate);
      return await this.prisma.urodynamicStudy.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byType]=await Promise.all([this.prisma.urodynamicStudy.count({where:{tenantId}}),this.prisma.urodynamicStudy.groupBy({by:['studyType'],where:{tenantId},_count:true})]);
      return { total, byType: byType.map(t=>({type:t.studyType,count:t._count})) };
    } catch { return { total: 0, byType: [] }; }
  }
}
