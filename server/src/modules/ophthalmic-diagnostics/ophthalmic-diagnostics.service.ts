import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class OphthalmicDiagnosticsService {
  private readonly logger = new Logger(OphthalmicDiagnosticsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.ophthalmicTest.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.ophthalmicTest.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.ophthalmicTest.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.eye!==undefined)data.eye=dto.eye;
      if(dto.visualAcuityOd!==undefined)data.visualAcuityOd=dto.visualAcuityOd;
      if(dto.visualAcuityOs!==undefined)data.visualAcuityOs=dto.visualAcuityOs;
      if(dto.drGradeOd!==undefined)data.drGradeOd=dto.drGradeOd;
      if(dto.drGradeOs!==undefined)data.drGradeOs=dto.drGradeOs;
      if(dto.referringDoctor!==undefined)data.referringDoctor=dto.referringDoctor;
      if(dto.findings!==undefined)data.findings=dto.findings;
            if(dto.iop_od!==undefined)data.iop_od=Number(dto.iop_od);
      if(dto.iop_os!==undefined)data.iop_os=Number(dto.iop_os);
      if(dto.octRnflAvgOd!==undefined)data.octRnflAvgOd=Number(dto.octRnflAvgOd);
      if(dto.octRnflAvgOs!==undefined)data.octRnflAvgOs=Number(dto.octRnflAvgOs);
      if(dto.vfMdOd!==undefined)data.vfMdOd=Number(dto.vfMdOd);
      if(dto.vfMdOs!==undefined)data.vfMdOs=Number(dto.vfMdOs);
      if(dto.signalStrength!==undefined)data.signalStrength=Number(dto.signalStrength);
      
            if(dto.testDate)data.testDate=new Date(dto.testDate);
      
            data.patientName=dto.patientName||'';
      data.testType=dto.testType||'';
      data.status=dto.status||'active';
      return await this.prisma.ophthalmicTest.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.ophthalmicTest.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.eye!==undefined)u.eye=dto.eye;
      if(dto.visualAcuityOd!==undefined)u.visualAcuityOd=dto.visualAcuityOd;
      if(dto.visualAcuityOs!==undefined)u.visualAcuityOs=dto.visualAcuityOs;
      if(dto.drGradeOd!==undefined)u.drGradeOd=dto.drGradeOd;
      if(dto.drGradeOs!==undefined)u.drGradeOs=dto.drGradeOs;
      if(dto.referringDoctor!==undefined)u.referringDoctor=dto.referringDoctor;
      if(dto.findings!==undefined)u.findings=dto.findings;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.testType!==undefined)u.testType=dto.testType;
            if(dto.iop_od!==undefined)u.iop_od=Number(dto.iop_od);
      if(dto.iop_os!==undefined)u.iop_os=Number(dto.iop_os);
      if(dto.octRnflAvgOd!==undefined)u.octRnflAvgOd=Number(dto.octRnflAvgOd);
      if(dto.octRnflAvgOs!==undefined)u.octRnflAvgOs=Number(dto.octRnflAvgOs);
      if(dto.vfMdOd!==undefined)u.vfMdOd=Number(dto.vfMdOd);
      if(dto.vfMdOs!==undefined)u.vfMdOs=Number(dto.vfMdOs);
      if(dto.signalStrength!==undefined)u.signalStrength=Number(dto.signalStrength);
      
            if(dto.testDate)u.testDate=new Date(dto.testDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.ophthalmicTest.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.ophthalmicTest.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
