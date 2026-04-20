import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class UrodynamicsCenterService {
  private readonly logger = new Logger(UrodynamicsCenterService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.urodynamicsStudy2.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.urodynamicsStudy2.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.urodynamicsStudy2.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.patientGender!==undefined)data.patientGender=dto.patientGender;
      if(dto.clinicalIndication!==undefined)data.clinicalIndication=dto.clinicalIndication;
      if(dto.diagnosis!==undefined)data.diagnosis=dto.diagnosis;
      if(dto.performedBy!==undefined)data.performedBy=dto.performedBy;
      if(dto.interpretedBy!==undefined)data.interpretedBy=dto.interpretedBy;
            if(dto.patientAge!==undefined)data.patientAge=Number(dto.patientAge);
      if(dto.qmax!==undefined)data.qmax=Number(dto.qmax);
      if(dto.qavg!==undefined)data.qavg=Number(dto.qavg);
      if(dto.voidedVolumeMl!==undefined)data.voidedVolumeMl=Number(dto.voidedVolumeMl);
      if(dto.pvrMl!==undefined)data.pvrMl=Number(dto.pvrMl);
      if(dto.maxCapacityMl!==undefined)data.maxCapacityMl=Number(dto.maxCapacityMl);
      if(dto.complianceMlCmh2o!==undefined)data.complianceMlCmh2o=Number(dto.complianceMlCmh2o);
      if(dto.booiIndex!==undefined)data.booiIndex=Number(dto.booiIndex);
            if(dto.detrusorOveractivity!==undefined)data.detrusorOveractivity=!!dto.detrusorOveractivity;
            if(dto.studyDate)data.studyDate=new Date(dto.studyDate);
      
            data.patientName=dto.patientName||'';
      data.studyType=dto.studyType||'';
      data.status=dto.status||'active';
      return await this.prisma.urodynamicsStudy2.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.urodynamicsStudy2.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.patientGender!==undefined)u.patientGender=dto.patientGender;
      if(dto.clinicalIndication!==undefined)u.clinicalIndication=dto.clinicalIndication;
      if(dto.diagnosis!==undefined)u.diagnosis=dto.diagnosis;
      if(dto.performedBy!==undefined)u.performedBy=dto.performedBy;
      if(dto.interpretedBy!==undefined)u.interpretedBy=dto.interpretedBy;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.studyType!==undefined)u.studyType=dto.studyType;
            if(dto.patientAge!==undefined)u.patientAge=Number(dto.patientAge);
      if(dto.qmax!==undefined)u.qmax=Number(dto.qmax);
      if(dto.qavg!==undefined)u.qavg=Number(dto.qavg);
      if(dto.voidedVolumeMl!==undefined)u.voidedVolumeMl=Number(dto.voidedVolumeMl);
      if(dto.pvrMl!==undefined)u.pvrMl=Number(dto.pvrMl);
      if(dto.maxCapacityMl!==undefined)u.maxCapacityMl=Number(dto.maxCapacityMl);
      if(dto.complianceMlCmh2o!==undefined)u.complianceMlCmh2o=Number(dto.complianceMlCmh2o);
      if(dto.booiIndex!==undefined)u.booiIndex=Number(dto.booiIndex);
            if(dto.detrusorOveractivity!==undefined)u.detrusorOveractivity=!!dto.detrusorOveractivity;
            if(dto.studyDate)u.studyDate=new Date(dto.studyDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.urodynamicsStudy2.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.urodynamicsStudy2.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
