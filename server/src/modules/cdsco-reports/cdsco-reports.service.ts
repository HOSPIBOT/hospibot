import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// CDSCO (Central Drugs Standard Control Organisation) reporting
// Medical Devices Rules 2017, IVD classes A-D
// SUGAM online portal, post-market surveillance
// Adverse event reporting, kit validation tracking
@Injectable()
export class CdscoReportsService {
  private readonly logger = new Logger(CdscoReportsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, reportType, status, search } = query;
      const where: any = { tenantId }; if(reportType)where.reportType=reportType; if(status)where.status=status;
      if(search){where.OR=[{deviceName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.cdscoReport.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.cdscoReport.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.cdscoReport.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.reportType)throw new BadRequestException('Report type required (adverse-event/post-market-surveillance/kit-validation/license-renewal)');
      return await this.prisma.cdscoReport.create({ data: {
        tenantId, reportType:dto.reportType, reportTitle:dto.reportTitle||null,
        deviceName:dto.deviceName||null, deviceClass:dto.deviceClass||null,
        manufacturerName:dto.manufacturerName||null, manufacturerCountry:dto.manufacturerCountry||null,
        licenseNumber:dto.licenseNumber||null, licenseExpiry:dto.licenseExpiry?new Date(dto.licenseExpiry):null,
        sugamApplicationId:dto.sugamApplicationId||null,
        // Adverse event
        adverseEventDate:dto.adverseEventDate?new Date(dto.adverseEventDate):null,
        adverseEventDescription:dto.adverseEventDescription||null,
        patientImpact:dto.patientImpact||null, severityLevel:dto.severityLevel||null,
        correctiveAction:dto.correctiveAction||null,
        reportedToManufacturer:dto.reportedToManufacturer||false,
        reportedToCdsco:dto.reportedToCdsco||false,
        cdscoReportDate:dto.cdscoReportDate?new Date(dto.cdscoReportDate):null,
        // Kit validation
        kitName:dto.kitName||null, kitLotNumber:dto.kitLotNumber||null,
        kitExpiry:dto.kitExpiry?new Date(dto.kitExpiry):null,
        sensitivityPct:dto.sensitivityPct?Number(dto.sensitivityPct):null,
        specificityPct:dto.specificityPct?Number(dto.specificityPct):null,
        accuracyPct:dto.accuracyPct?Number(dto.accuracyPct):null,
        samplesTestedCount:dto.samplesTestedCount?Number(dto.samplesTestedCount):null,
        validationResult:dto.validationResult||null,
        // PMS
        pmsReportingPeriod:dto.pmsReportingPeriod||null,
        complaintsReceived:dto.complaintsReceived?Number(dto.complaintsReceived):null,
        fieldSafetyActions:dto.fieldSafetyActions||null,
        notes:dto.notes||null, status:dto.status||'draft', createdBy:userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.cdscoReport.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['reportType','reportTitle','deviceName','deviceClass','manufacturerName','manufacturerCountry','licenseNumber','sugamApplicationId','adverseEventDescription','patientImpact','severityLevel','correctiveAction','reportedToManufacturer','reportedToCdsco','kitName','kitLotNumber','validationResult','pmsReportingPeriod','fieldSafetyActions','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['sensitivityPct','specificityPct','accuracyPct','samplesTestedCount','complaintsReceived'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['licenseExpiry','adverseEventDate','cdscoReportDate','kitExpiry'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.cdscoReport.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byType,adverse]=await Promise.all([this.prisma.cdscoReport.count({where:{tenantId}}),this.prisma.cdscoReport.groupBy({by:['reportType'],where:{tenantId},_count:true}),this.prisma.cdscoReport.count({where:{tenantId,reportType:'adverse-event'}})]);
      return { total, adverseEvents: adverse, byType: byType.map(t=>({type:t.reportType,count:t._count})) };
    } catch { return { total: 0, adverseEvents: 0, byType: [] }; }
  }
}
