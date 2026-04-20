import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class DentalRadiologyService {
  private readonly logger = new Logger(DentalRadiologyService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.dentalScan.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.dentalScan.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.dentalScan.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.referringDentist!==undefined)data.referringDentist=dto.referringDentist;
      if(dto.clinicalIndication!==undefined)data.clinicalIndication=dto.clinicalIndication;
      if(dto.jawSection!==undefined)data.jawSection=dto.jawSection;
      if(dto.fieldOfView!==undefined)data.fieldOfView=dto.fieldOfView;
      if(dto.findings!==undefined)data.findings=dto.findings;
      if(dto.reportedBy!==undefined)data.reportedBy=dto.reportedBy;
            if(dto.kvp!==undefined)data.kvp=Number(dto.kvp);
      if(dto.mA!==undefined)data.mA=Number(dto.mA);
      if(dto.exposureTimeSec!==undefined)data.exposureTimeSec=Number(dto.exposureTimeSec);
            if(dto.pregnancyScreened!==undefined)data.pregnancyScreened=!!dto.pregnancyScreened;
      if(dto.leadApronUsed!==undefined)data.leadApronUsed=!!dto.leadApronUsed;
      if(dto.thyroidShieldUsed!==undefined)data.thyroidShieldUsed=!!dto.thyroidShieldUsed;
            if(dto.scanDate)data.scanDate=new Date(dto.scanDate);
      
            data.patientName=dto.patientName||'';
      data.scanType=dto.scanType||'';
      data.status=dto.status||'active';
      return await this.prisma.dentalScan.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.dentalScan.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.referringDentist!==undefined)u.referringDentist=dto.referringDentist;
      if(dto.clinicalIndication!==undefined)u.clinicalIndication=dto.clinicalIndication;
      if(dto.jawSection!==undefined)u.jawSection=dto.jawSection;
      if(dto.fieldOfView!==undefined)u.fieldOfView=dto.fieldOfView;
      if(dto.findings!==undefined)u.findings=dto.findings;
      if(dto.reportedBy!==undefined)u.reportedBy=dto.reportedBy;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.scanType!==undefined)u.scanType=dto.scanType;
            if(dto.kvp!==undefined)u.kvp=Number(dto.kvp);
      if(dto.mA!==undefined)u.mA=Number(dto.mA);
      if(dto.exposureTimeSec!==undefined)u.exposureTimeSec=Number(dto.exposureTimeSec);
            if(dto.pregnancyScreened!==undefined)u.pregnancyScreened=!!dto.pregnancyScreened;
      if(dto.leadApronUsed!==undefined)u.leadApronUsed=!!dto.leadApronUsed;
      if(dto.thyroidShieldUsed!==undefined)u.thyroidShieldUsed=!!dto.thyroidShieldUsed;
            if(dto.scanDate)u.scanDate=new Date(dto.scanDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.dentalScan.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.dentalScan.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
