import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class DtcGenomicsService {
  private readonly logger = new Logger(DtcGenomicsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{consumerName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.genomicsOrder.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.genomicsOrder.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.genomicsOrder.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.consumerEmail!==undefined)data.consumerEmail=dto.consumerEmail;
      if(dto.kitId!==undefined)data.kitId=dto.kitId;
      if(dto.testPanel!==undefined)data.testPanel=dto.testPanel;
      if(dto.genotypingPlatform!==undefined)data.genotypingPlatform=dto.genotypingPlatform;
      if(dto.reportDeliveredVia!==undefined)data.reportDeliveredVia=dto.reportDeliveredVia;
            if(dto.variantsAnalyzed!==undefined)data.variantsAnalyzed=Number(dto.variantsAnalyzed);
            if(dto.counselingBooked!==undefined)data.counselingBooked=!!dto.counselingBooked;
      if(dto.consentGiven!==undefined)data.consentGiven=!!dto.consentGiven;
      if(dto.dataProcessingConsent!==undefined)data.dataProcessingConsent=!!dto.dataProcessingConsent;
            if(dto.orderDate)data.orderDate=new Date(dto.orderDate);
      if(dto.kitDispatchDate)data.kitDispatchDate=new Date(dto.kitDispatchDate);
      if(dto.kitReceivedDate)data.kitReceivedDate=new Date(dto.kitReceivedDate);
      if(dto.reportGeneratedDate)data.reportGeneratedDate=new Date(dto.reportGeneratedDate);
            if(dto.riskScores)data.riskScores=dto.riskScores;
      if(dto.ancestryResults)data.ancestryResults=dto.ancestryResults;
      if(dto.pharmacogenomics)data.pharmacogenomics=dto.pharmacogenomics;
            data.consumerName=dto.consumerName||'';
      data.consumerPhone=dto.consumerPhone||'';
      data.status=dto.status||'active';
      return await this.prisma.genomicsOrder.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.genomicsOrder.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.consumerEmail!==undefined)u.consumerEmail=dto.consumerEmail;
      if(dto.kitId!==undefined)u.kitId=dto.kitId;
      if(dto.testPanel!==undefined)u.testPanel=dto.testPanel;
      if(dto.genotypingPlatform!==undefined)u.genotypingPlatform=dto.genotypingPlatform;
      if(dto.reportDeliveredVia!==undefined)u.reportDeliveredVia=dto.reportDeliveredVia;
      if(dto.consumerName!==undefined)u.consumerName=dto.consumerName;
      if(dto.consumerPhone!==undefined)u.consumerPhone=dto.consumerPhone;
            if(dto.variantsAnalyzed!==undefined)u.variantsAnalyzed=Number(dto.variantsAnalyzed);
            if(dto.counselingBooked!==undefined)u.counselingBooked=!!dto.counselingBooked;
      if(dto.consentGiven!==undefined)u.consentGiven=!!dto.consentGiven;
      if(dto.dataProcessingConsent!==undefined)u.dataProcessingConsent=!!dto.dataProcessingConsent;
            if(dto.orderDate)u.orderDate=new Date(dto.orderDate);
      if(dto.kitDispatchDate)u.kitDispatchDate=new Date(dto.kitDispatchDate);
      if(dto.kitReceivedDate)u.kitReceivedDate=new Date(dto.kitReceivedDate);
      if(dto.reportGeneratedDate)u.reportGeneratedDate=new Date(dto.reportGeneratedDate);
            if(dto.riskScores)u.riskScores=dto.riskScores;
      if(dto.ancestryResults)u.ancestryResults=dto.ancestryResults;
      if(dto.pharmacogenomics)u.pharmacogenomics=dto.pharmacogenomics;
      if(dto.status)u.status=dto.status;
      return await this.prisma.genomicsOrder.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.genomicsOrder.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
