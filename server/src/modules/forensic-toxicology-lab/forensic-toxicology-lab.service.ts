import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class ForensicToxicologyLabService {
  private readonly logger = new Logger(ForensicToxicologyLabService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{subjectName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.forensicCase.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.forensicCase.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.forensicCase.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.caseNumber!==undefined)data.caseNumber=dto.caseNumber;
      if(dto.collectorName!==undefined)data.collectorName=dto.collectorName;
      if(dto.chainOfCustodyId!==undefined)data.chainOfCustodyId=dto.chainOfCustodyId;
      if(dto.specimenType!==undefined)data.specimenType=dto.specimenType;
      if(dto.screenMethod!==undefined)data.screenMethod=dto.screenMethod;
      if(dto.screenResult!==undefined)data.screenResult=dto.screenResult;
      if(dto.confirmMethod!==undefined)data.confirmMethod=dto.confirmMethod;
      if(dto.confirmResult!==undefined)data.confirmResult=dto.confirmResult;
      if(dto.cutoffStandard!==undefined)data.cutoffStandard=dto.cutoffStandard;
      if(dto.mroDecision!==undefined)data.mroDecision=dto.mroDecision;
      if(dto.reportedBy!==undefined)data.reportedBy=dto.reportedBy;
      
            if(dto.sealIntact!==undefined)data.sealIntact=!!dto.sealIntact;
      if(dto.mroReviewed!==undefined)data.mroReviewed=!!dto.mroReviewed;
      if(dto.courtAdmissible!==undefined)data.courtAdmissible=!!dto.courtAdmissible;
            if(dto.collectionDate)data.collectionDate=new Date(dto.collectionDate);
            if(dto.substancesDetected)data.substancesDetected=dto.substancesDetected;
            data.subjectName=dto.subjectName||'';
      data.caseType=dto.caseType||'';
      data.status=dto.status||'active';
      return await this.prisma.forensicCase.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.forensicCase.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.caseNumber!==undefined)u.caseNumber=dto.caseNumber;
      if(dto.collectorName!==undefined)u.collectorName=dto.collectorName;
      if(dto.chainOfCustodyId!==undefined)u.chainOfCustodyId=dto.chainOfCustodyId;
      if(dto.specimenType!==undefined)u.specimenType=dto.specimenType;
      if(dto.screenMethod!==undefined)u.screenMethod=dto.screenMethod;
      if(dto.screenResult!==undefined)u.screenResult=dto.screenResult;
      if(dto.confirmMethod!==undefined)u.confirmMethod=dto.confirmMethod;
      if(dto.confirmResult!==undefined)u.confirmResult=dto.confirmResult;
      if(dto.cutoffStandard!==undefined)u.cutoffStandard=dto.cutoffStandard;
      if(dto.mroDecision!==undefined)u.mroDecision=dto.mroDecision;
      if(dto.reportedBy!==undefined)u.reportedBy=dto.reportedBy;
      if(dto.subjectName!==undefined)u.subjectName=dto.subjectName;
      if(dto.caseType!==undefined)u.caseType=dto.caseType;
      
            if(dto.sealIntact!==undefined)u.sealIntact=!!dto.sealIntact;
      if(dto.mroReviewed!==undefined)u.mroReviewed=!!dto.mroReviewed;
      if(dto.courtAdmissible!==undefined)u.courtAdmissible=!!dto.courtAdmissible;
            if(dto.collectionDate)u.collectionDate=new Date(dto.collectionDate);
            if(dto.substancesDetected)u.substancesDetected=dto.substancesDetected;
      if(dto.status)u.status=dto.status;
      return await this.prisma.forensicCase.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.forensicCase.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
