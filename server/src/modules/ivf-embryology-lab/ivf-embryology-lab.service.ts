import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class IvfEmbryologyLabService {
  private readonly logger = new Logger(IvfEmbryologyLabService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.ivfLabEntry.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.ivfLabEntry.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.ivfLabEntry.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.cycleId!==undefined)data.cycleId=dto.cycleId;
      if(dto.partnerName!==undefined)data.partnerName=dto.partnerName;
      if(dto.fertilizationMethod!==undefined)data.fertilizationMethod=dto.fertilizationMethod;
      if(dto.embryoGrade!==undefined)data.embryoGrade=dto.embryoGrade;
      if(dto.cryoTankId!==undefined)data.cryoTankId=dto.cryoTankId;
      if(dto.cryoPosition!==undefined)data.cryoPosition=dto.cryoPosition;
      if(dto.pgtResult!==undefined)data.pgtResult=dto.pgtResult;
            if(dto.semenCount!==undefined)data.semenCount=Number(dto.semenCount);
      if(dto.semenMotility!==undefined)data.semenMotility=Number(dto.semenMotility);
      if(dto.semenMorphology!==undefined)data.semenMorphology=Number(dto.semenMorphology);
      if(dto.oocytesRetrieved!==undefined)data.oocytesRetrieved=Number(dto.oocytesRetrieved);
      if(dto.miiOocytes!==undefined)data.miiOocytes=Number(dto.miiOocytes);
      if(dto.embryosFormed!==undefined)data.embryosFormed=Number(dto.embryosFormed);
      if(dto.dayOfTransfer!==undefined)data.dayOfTransfer=Number(dto.dayOfTransfer);
      if(dto.embryosTransferred!==undefined)data.embryosTransferred=Number(dto.embryosTransferred);
      if(dto.embryosFrozen!==undefined)data.embryosFrozen=Number(dto.embryosFrozen);
            if(dto.witnessVerified!==undefined)data.witnessVerified=!!dto.witnessVerified;
      if(dto.artActCompliant!==undefined)data.artActCompliant=!!dto.artActCompliant;
      
      
            data.patientName=dto.patientName||'';
      data.entryType=dto.entryType||'';
      data.status=dto.status||'active';
      return await this.prisma.ivfLabEntry.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.ivfLabEntry.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.cycleId!==undefined)u.cycleId=dto.cycleId;
      if(dto.partnerName!==undefined)u.partnerName=dto.partnerName;
      if(dto.fertilizationMethod!==undefined)u.fertilizationMethod=dto.fertilizationMethod;
      if(dto.embryoGrade!==undefined)u.embryoGrade=dto.embryoGrade;
      if(dto.cryoTankId!==undefined)u.cryoTankId=dto.cryoTankId;
      if(dto.cryoPosition!==undefined)u.cryoPosition=dto.cryoPosition;
      if(dto.pgtResult!==undefined)u.pgtResult=dto.pgtResult;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.entryType!==undefined)u.entryType=dto.entryType;
            if(dto.semenCount!==undefined)u.semenCount=Number(dto.semenCount);
      if(dto.semenMotility!==undefined)u.semenMotility=Number(dto.semenMotility);
      if(dto.semenMorphology!==undefined)u.semenMorphology=Number(dto.semenMorphology);
      if(dto.oocytesRetrieved!==undefined)u.oocytesRetrieved=Number(dto.oocytesRetrieved);
      if(dto.miiOocytes!==undefined)u.miiOocytes=Number(dto.miiOocytes);
      if(dto.embryosFormed!==undefined)u.embryosFormed=Number(dto.embryosFormed);
      if(dto.dayOfTransfer!==undefined)u.dayOfTransfer=Number(dto.dayOfTransfer);
      if(dto.embryosTransferred!==undefined)u.embryosTransferred=Number(dto.embryosTransferred);
      if(dto.embryosFrozen!==undefined)u.embryosFrozen=Number(dto.embryosFrozen);
            if(dto.witnessVerified!==undefined)u.witnessVerified=!!dto.witnessVerified;
      if(dto.artActCompliant!==undefined)u.artActCompliant=!!dto.artActCompliant;
      
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.ivfLabEntry.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.ivfLabEntry.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
