import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class EndoscopyCenterService {
  private readonly logger = new Logger(EndoscopyCenterService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.endoscopyProcedure.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.endoscopyProcedure.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.endoscopyProcedure.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.indication!==undefined)data.indication=dto.indication;
      if(dto.sedationType!==undefined)data.sedationType=dto.sedationType;
      if(dto.sedationDose!==undefined)data.sedationDose=dto.sedationDose;
      if(dto.endoscopist!==undefined)data.endoscopist=dto.endoscopist;
      if(dto.assistant!==undefined)data.assistant=dto.assistant;
      if(dto.findings!==undefined)data.findings=dto.findings;
      if(dto.biopsySite!==undefined)data.biopsySite=dto.biopsySite;
      if(dto.biopsySpecimenId!==undefined)data.biopsySpecimenId=dto.biopsySpecimenId;
      if(dto.complication!==undefined)data.complication=dto.complication;
      if(dto.scopeId!==undefined)data.scopeId=dto.scopeId;
            if(dto.bostonBowelPrepScore!==undefined)data.bostonBowelPrepScore=Number(dto.bostonBowelPrepScore);
            if(dto.biopsyTaken!==undefined)data.biopsyTaken=!!dto.biopsyTaken;
      if(dto.scopeReprocessed!==undefined)data.scopeReprocessed=!!dto.scopeReprocessed;
            if(dto.procedureDate)data.procedureDate=new Date(dto.procedureDate);
            if(dto.images)data.images=dto.images;
            data.patientName=dto.patientName||'';
      data.procedureType=dto.procedureType||'';
      data.status=dto.status||'active';
      return await this.prisma.endoscopyProcedure.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.endoscopyProcedure.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.indication!==undefined)u.indication=dto.indication;
      if(dto.sedationType!==undefined)u.sedationType=dto.sedationType;
      if(dto.sedationDose!==undefined)u.sedationDose=dto.sedationDose;
      if(dto.endoscopist!==undefined)u.endoscopist=dto.endoscopist;
      if(dto.assistant!==undefined)u.assistant=dto.assistant;
      if(dto.findings!==undefined)u.findings=dto.findings;
      if(dto.biopsySite!==undefined)u.biopsySite=dto.biopsySite;
      if(dto.biopsySpecimenId!==undefined)u.biopsySpecimenId=dto.biopsySpecimenId;
      if(dto.complication!==undefined)u.complication=dto.complication;
      if(dto.scopeId!==undefined)u.scopeId=dto.scopeId;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.procedureType!==undefined)u.procedureType=dto.procedureType;
            if(dto.bostonBowelPrepScore!==undefined)u.bostonBowelPrepScore=Number(dto.bostonBowelPrepScore);
            if(dto.biopsyTaken!==undefined)u.biopsyTaken=!!dto.biopsyTaken;
      if(dto.scopeReprocessed!==undefined)u.scopeReprocessed=!!dto.scopeReprocessed;
            if(dto.procedureDate)u.procedureDate=new Date(dto.procedureDate);
            if(dto.images)u.images=dto.images;
      if(dto.status)u.status=dto.status;
      return await this.prisma.endoscopyProcedure.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.endoscopyProcedure.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
