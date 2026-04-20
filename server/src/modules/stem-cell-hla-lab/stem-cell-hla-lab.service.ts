import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class StemCellHlaLabService {
  private readonly logger = new Logger(StemCellHlaLabService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.hlaDonorSearch.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.hlaDonorSearch.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.hlaDonorSearch.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.hlaA!==undefined)data.hlaA=dto.hlaA;
      if(dto.hlaB!==undefined)data.hlaB=dto.hlaB;
      if(dto.hlaC!==undefined)data.hlaC=dto.hlaC;
      if(dto.hlaDrb1!==undefined)data.hlaDrb1=dto.hlaDrb1;
      if(dto.hlaDqb1!==undefined)data.hlaDqb1=dto.hlaDqb1;
      if(dto.typingMethod!==undefined)data.typingMethod=dto.typingMethod;
      if(dto.typingResolution!==undefined)data.typingResolution=dto.typingResolution;
      if(dto.registryName!==undefined)data.registryName=dto.registryName;
      if(dto.donorId!==undefined)data.donorId=dto.donorId;
      if(dto.matchScore!==undefined)data.matchScore=dto.matchScore;
      if(dto.workupStatus!==undefined)data.workupStatus=dto.workupStatus;
      if(dto.cordBloodUnitId!==undefined)data.cordBloodUnitId=dto.cordBloodUnitId;
      if(dto.cryoTankId!==undefined)data.cryoTankId=dto.cryoTankId;
            if(dto.cd34Count!==undefined)data.cd34Count=Number(dto.cd34Count);
      if(dto.viabilityPct!==undefined)data.viabilityPct=Number(dto.viabilityPct);
      
            if(dto.transplantDate)data.transplantDate=new Date(dto.transplantDate);
      
            data.patientName=dto.patientName||'';
      data.entryType=dto.entryType||'';
      data.status=dto.status||'active';
      return await this.prisma.hlaDonorSearch.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.hlaDonorSearch.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.hlaA!==undefined)u.hlaA=dto.hlaA;
      if(dto.hlaB!==undefined)u.hlaB=dto.hlaB;
      if(dto.hlaC!==undefined)u.hlaC=dto.hlaC;
      if(dto.hlaDrb1!==undefined)u.hlaDrb1=dto.hlaDrb1;
      if(dto.hlaDqb1!==undefined)u.hlaDqb1=dto.hlaDqb1;
      if(dto.typingMethod!==undefined)u.typingMethod=dto.typingMethod;
      if(dto.typingResolution!==undefined)u.typingResolution=dto.typingResolution;
      if(dto.registryName!==undefined)u.registryName=dto.registryName;
      if(dto.donorId!==undefined)u.donorId=dto.donorId;
      if(dto.matchScore!==undefined)u.matchScore=dto.matchScore;
      if(dto.workupStatus!==undefined)u.workupStatus=dto.workupStatus;
      if(dto.cordBloodUnitId!==undefined)u.cordBloodUnitId=dto.cordBloodUnitId;
      if(dto.cryoTankId!==undefined)u.cryoTankId=dto.cryoTankId;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.entryType!==undefined)u.entryType=dto.entryType;
            if(dto.cd34Count!==undefined)u.cd34Count=Number(dto.cd34Count);
      if(dto.viabilityPct!==undefined)u.viabilityPct=Number(dto.viabilityPct);
      
            if(dto.transplantDate)u.transplantDate=new Date(dto.transplantDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.hlaDonorSearch.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.hlaDonorSearch.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
