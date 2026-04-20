import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class AudiologyCenterService {
  private readonly logger = new Logger(AudiologyCenterService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.audiologyTest.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.audiologyTest.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.audiologyTest.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.hearingLossType!==undefined)data.hearingLossType=dto.hearingLossType;
      if(dto.hearingLossGrade!==undefined)data.hearingLossGrade=dto.hearingLossGrade;
      if(dto.tympanogramRight!==undefined)data.tympanogramRight=dto.tympanogramRight;
      if(dto.tympanogramLeft!==undefined)data.tympanogramLeft=dto.tympanogramLeft;
      if(dto.oaeResult!==undefined)data.oaeResult=dto.oaeResult;
      if(dto.hearingAidModel!==undefined)data.hearingAidModel=dto.hearingAidModel;
      if(dto.referringDoctor!==undefined)data.referringDoctor=dto.referringDoctor;
            if(dto.patientAge!==undefined)data.patientAge=Number(dto.patientAge);
      if(dto.ptaRightDb!==undefined)data.ptaRightDb=Number(dto.ptaRightDb);
      if(dto.ptaLeftDb!==undefined)data.ptaLeftDb=Number(dto.ptaLeftDb);
      if(dto.beraThreshold!==undefined)data.beraThreshold=Number(dto.beraThreshold);
            if(dto.hearingAidRecommended!==undefined)data.hearingAidRecommended=!!dto.hearingAidRecommended;
            if(dto.testDate)data.testDate=new Date(dto.testDate);
      
            data.patientName=dto.patientName||'';
      data.testType=dto.testType||'';
      data.status=dto.status||'active';
      return await this.prisma.audiologyTest.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.audiologyTest.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.hearingLossType!==undefined)u.hearingLossType=dto.hearingLossType;
      if(dto.hearingLossGrade!==undefined)u.hearingLossGrade=dto.hearingLossGrade;
      if(dto.tympanogramRight!==undefined)u.tympanogramRight=dto.tympanogramRight;
      if(dto.tympanogramLeft!==undefined)u.tympanogramLeft=dto.tympanogramLeft;
      if(dto.oaeResult!==undefined)u.oaeResult=dto.oaeResult;
      if(dto.hearingAidModel!==undefined)u.hearingAidModel=dto.hearingAidModel;
      if(dto.referringDoctor!==undefined)u.referringDoctor=dto.referringDoctor;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.testType!==undefined)u.testType=dto.testType;
            if(dto.patientAge!==undefined)u.patientAge=Number(dto.patientAge);
      if(dto.ptaRightDb!==undefined)u.ptaRightDb=Number(dto.ptaRightDb);
      if(dto.ptaLeftDb!==undefined)u.ptaLeftDb=Number(dto.ptaLeftDb);
      if(dto.beraThreshold!==undefined)u.beraThreshold=Number(dto.beraThreshold);
            if(dto.hearingAidRecommended!==undefined)u.hearingAidRecommended=!!dto.hearingAidRecommended;
            if(dto.testDate)u.testDate=new Date(dto.testDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.audiologyTest.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.audiologyTest.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
