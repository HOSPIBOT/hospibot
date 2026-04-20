import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class DicomViewerService {
  private readonly logger = new Logger(DicomViewerService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, modality, reportStatus, search } = query;
      const where: any = { tenantId }; if(modality)where.modality=modality; if(reportStatus)where.reportStatus=reportStatus;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}},{accessionNumber:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.dicomStudy.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.dicomStudy.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.dicomStudy.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      return await this.prisma.dicomStudy.create({ data: {
        tenantId, patientId: dto.patientId||null, patientName: dto.patientName||null,
        accessionNumber: dto.accessionNumber||null, studyInstanceUid: dto.studyInstanceUid||null,
        studyDate: dto.studyDate?new Date(dto.studyDate):null, modality: dto.modality||null,
        studyDescription: dto.studyDescription||null, bodyPart: dto.bodyPart||null,
        seriesCount: dto.seriesCount?Number(dto.seriesCount):null, imageCount: dto.imageCount?Number(dto.imageCount):null,
        storageSize: dto.storageSize||null, pacsServerId: dto.pacsServerId||null,
        pacsServerName: dto.pacsServerName||null, viewerUrl: dto.viewerUrl||null,
        referringDoctor: dto.referringDoctor||null, performingDoctor: dto.performingDoctor||null,
        reportStatus: dto.reportStatus||'pending', criticalFinding: dto.criticalFinding||false,
        notes: dto.notes||null, status: dto.status||'received', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.dicomStudy.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['patientName','accessionNumber','studyInstanceUid','modality','studyDescription','bodyPart','storageSize','pacsServerId','pacsServerName','viewerUrl','referringDoctor','performingDoctor','reportStatus','reportedBy','criticalFinding','institutionName','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['seriesCount','imageCount'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['studyDate','reportDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.dicomStudy.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byModality]=await Promise.all([this.prisma.dicomStudy.count({where:{tenantId}}),this.prisma.dicomStudy.groupBy({by:['modality'],where:{tenantId},_count:true})]);
      return { total, byModality: byModality.filter(m=>m.modality).map(m=>({modality:m.modality,count:m._count})) };
    } catch { return { total: 0, byModality: [] }; }
  }
}
