import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class NuclearMedicineService {
  private readonly logger = new Logger(NuclearMedicineService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.nuclearMedicineStudy.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.nuclearMedicineStudy.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.nuclearMedicineStudy.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.isotope!==undefined)data.isotope=dto.isotope;
      if(dto.scanProtocol!==undefined)data.scanProtocol=dto.scanProtocol;
      if(dto.organTarget!==undefined)data.organTarget=dto.organTarget;
      if(dto.reportingPhysician!==undefined)data.reportingPhysician=dto.reportingPhysician;
      if(dto.findings!==undefined)data.findings=dto.findings;
            if(dto.halfLifeHours!==undefined)data.halfLifeHours=Number(dto.halfLifeHours);
      if(dto.administeredActivityMbq!==undefined)data.administeredActivityMbq=Number(dto.administeredActivityMbq);
      if(dto.isolationDays!==undefined)data.isolationDays=Number(dto.isolationDays);
            if(dto.therapyDose!==undefined)data.therapyDose=!!dto.therapyDose;
      if(dto.isolationRequired!==undefined)data.isolationRequired=!!dto.isolationRequired;
      if(dto.dosimetryDone!==undefined)data.dosimetryDone=!!dto.dosimetryDone;
      if(dto.aerbDoseLogged!==undefined)data.aerbDoseLogged=!!dto.aerbDoseLogged;
            if(dto.studyDate)data.studyDate=new Date(dto.studyDate);
      
            data.patientName=dto.patientName||'';
      data.studyType=dto.studyType||'';
      data.status=dto.status||'active';
      return await this.prisma.nuclearMedicineStudy.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.nuclearMedicineStudy.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.isotope!==undefined)u.isotope=dto.isotope;
      if(dto.scanProtocol!==undefined)u.scanProtocol=dto.scanProtocol;
      if(dto.organTarget!==undefined)u.organTarget=dto.organTarget;
      if(dto.reportingPhysician!==undefined)u.reportingPhysician=dto.reportingPhysician;
      if(dto.findings!==undefined)u.findings=dto.findings;
      if(dto.patientName!==undefined)u.patientName=dto.patientName;
      if(dto.studyType!==undefined)u.studyType=dto.studyType;
            if(dto.halfLifeHours!==undefined)u.halfLifeHours=Number(dto.halfLifeHours);
      if(dto.administeredActivityMbq!==undefined)u.administeredActivityMbq=Number(dto.administeredActivityMbq);
      if(dto.isolationDays!==undefined)u.isolationDays=Number(dto.isolationDays);
            if(dto.therapyDose!==undefined)u.therapyDose=!!dto.therapyDose;
      if(dto.isolationRequired!==undefined)u.isolationRequired=!!dto.isolationRequired;
      if(dto.dosimetryDone!==undefined)u.dosimetryDone=!!dto.dosimetryDone;
      if(dto.aerbDoseLogged!==undefined)u.aerbDoseLogged=!!dto.aerbDoseLogged;
            if(dto.studyDate)u.studyDate=new Date(dto.studyDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.nuclearMedicineStudy.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.nuclearMedicineStudy.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
