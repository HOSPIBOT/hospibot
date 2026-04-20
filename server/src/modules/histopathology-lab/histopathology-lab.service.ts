import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class HistopathologyLabService {
  private readonly logger = new Logger(HistopathologyLabService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.histopathologyCase.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.histopathologyCase.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.histopathologyCase.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.specimenType!==undefined)data.specimenType=dto.specimenType;
      if(dto.specimenSource!==undefined)data.specimenSource=dto.specimenSource;
      if(dto.clinicalHistory!==undefined)data.clinicalHistory=dto.clinicalHistory;
      if(dto.grossDescription!==undefined)data.grossDescription=dto.grossDescription;
      if(dto.microscopicFindings!==undefined)data.microscopicFindings=dto.microscopicFindings;
      if(dto.diagnosis!==undefined)data.diagnosis=dto.diagnosis;
      if(dto.icdCode!==undefined)data.icdCode=dto.icdCode;
      if(dto.ihcPanel!==undefined)data.ihcPanel=dto.ihcPanel;
      if(dto.frozenSectionResult!==undefined)data.frozenSectionResult=dto.frozenSectionResult;
      if(dto.reportingPathologist!==undefined)data.reportingPathologist=dto.reportingPathologist;
            if(dto.patientAge!==undefined)data.patientAge=Number(dto.patientAge);
      if(dto.turnaroundHours!==undefined)data.turnaroundHours=Number(dto.turnaroundHours);
      if(dto.blockCount!==undefined)data.blockCount=Number(dto.blockCount);
      if(dto.slideCount!==undefined)data.slideCount=Number(dto.slideCount);
            if(dto.frozenSection!==undefined)data.frozenSection=!!dto.frozenSection;
      if(dto.capSynoptic!==undefined)data.capSynoptic=!!dto.capSynoptic;
      
            if(dto.ihcResults)data.ihcResults=dto.ihcResults;
            data.patientName=dto.patientName||'';
      data.status=dto.status||'active';
      return await this.prisma.histopathologyCase.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.histopathologyCase.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.specimenType!==undefined)u.specimenType=dto.specimenType;
      if(dto.specimenSource!==undefined)u.specimenSource=dto.specimenSource;
      if(dto.clinicalHistory!==undefined)u.clinicalHistory=dto.clinicalHistory;
      if(dto.grossDescription!==undefined)u.grossDescription=dto.grossDescription;
      if(dto.microscopicFindings!==undefined)u.microscopicFindings=dto.microscopicFindings;
      if(dto.diagnosis!==undefined)u.diagnosis=dto.diagnosis;
      if(dto.icdCode!==undefined)u.icdCode=dto.icdCode;
      if(dto.ihcPanel!==undefined)u.ihcPanel=dto.ihcPanel;
      if(dto.frozenSectionResult!==undefined)u.frozenSectionResult=dto.frozenSectionResult;
      if(dto.reportingPathologist!==undefined)u.reportingPathologist=dto.reportingPathologist;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
            if(dto.patientAge!==undefined)u.patientAge=Number(dto.patientAge);
      if(dto.turnaroundHours!==undefined)u.turnaroundHours=Number(dto.turnaroundHours);
      if(dto.blockCount!==undefined)u.blockCount=Number(dto.blockCount);
      if(dto.slideCount!==undefined)u.slideCount=Number(dto.slideCount);
            if(dto.frozenSection!==undefined)u.frozenSection=!!dto.frozenSection;
      if(dto.capSynoptic!==undefined)u.capSynoptic=!!dto.capSynoptic;
      
            if(dto.ihcResults)u.ihcResults=dto.ihcResults;
      if(dto.status)u.status=dto.status;
      return await this.prisma.histopathologyCase.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.histopathologyCase.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
