import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class RadiologistPanelService {
  private readonly logger = new Logger(RadiologistPanelService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{radiologistName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.radiologistAssignment.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.radiologistAssignment.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.radiologistAssignment.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.radiologistName)throw new BadRequestException('Radiologist name required');
      return await this.prisma.radiologistAssignment.create({ data: {
        tenantId, radiologistName: dto.radiologistName, radiologistId: dto.radiologistId||null,
        mciRegNo: dto.mciRegNo||null, specialization: dto.specialization||null,
        modalitiesHandled: dto.modalitiesHandled||null,
        assignedStudyId: dto.assignedStudyId||null, accessionNumber: dto.accessionNumber||null,
        patientName: dto.patientName||null, modality: dto.modality||null,
        priority: dto.priority||'routine',
        assignedDate: dto.assignedDate?new Date(dto.assignedDate):new Date(),
        dailyCapacity: dto.dailyCapacity?Number(dto.dailyCapacity):null,
        remoteReading: dto.remoteReading||false, statesRegistered: dto.statesRegistered||null,
        notes: dto.notes||null, status: dto.status||'available', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.radiologistAssignment.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['radiologistName','radiologistId','mciRegNo','specialization','modalitiesHandled','assignedStudyId','accessionNumber','patientName','modality','priority','reportStatus','criticalFinding','addendum','digitalSignature','remoteReading','statesRegistered','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['tatMinutes','workloadToday','dailyCapacity'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['assignedDate','readStartTime','readEndTime'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.radiologistAssignment.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byStatus]=await Promise.all([this.prisma.radiologistAssignment.count({where:{tenantId}}),this.prisma.radiologistAssignment.groupBy({by:['status'],where:{tenantId},_count:true})]);
      return { total, byStatus: byStatus.map(s=>({status:s.status,count:s._count})) };
    } catch { return { total: 0, byStatus: [] }; }
  }
}
