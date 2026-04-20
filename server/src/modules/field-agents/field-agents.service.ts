import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class FieldAgentsService {
  private readonly logger = new Logger(FieldAgentsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, zone, search } = query;
      const where: any = { tenantId }; if(status)where.status=status; if(zone)where.zone=zone;
      if(search){where.OR=[{agentName:{contains:search,mode:'insensitive'}},{agentPhone:{contains:search}}]}
      const [data,total]=await Promise.all([this.prisma.fieldAgent.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.fieldAgent.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.fieldAgent.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.agentName)throw new BadRequestException('Agent name required');
      if(!dto.agentPhone)throw new BadRequestException('Agent phone required');
      return await this.prisma.fieldAgent.create({ data: {
        tenantId, agentName: dto.agentName, agentPhone: dto.agentPhone,
        agentEmail: dto.agentEmail||null, agentId: dto.agentId||null,
        dmltCertNo: dto.dmltCertNo||null, dmltExpiry: dto.dmltExpiry?new Date(dto.dmltExpiry):null,
        designation: dto.designation||'phlebotomist', zone: dto.zone||null, city: dto.city||null,
        pincodesServed: dto.pincodesServed||null, vehicleType: dto.vehicleType||null,
        vehicleNumber: dto.vehicleNumber||null, coldBoxAssigned: dto.coldBoxAssigned||false,
        dailyCapacity: dto.dailyCapacity?Number(dto.dailyCapacity):null,
        shiftStart: dto.shiftStart||null, shiftEnd: dto.shiftEnd||null,
        notes: dto.notes||null, status: dto.status||'active', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.fieldAgent.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['agentName','agentPhone','agentEmail','agentId','dmltCertNo','designation','zone','city','pincodesServed','vehicleType','vehicleNumber','coldBoxAssigned','shiftStart','shiftEnd','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['dailyCapacity','samplesCollectedToday'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['currentLat','currentLng','rating'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      if(dto.dmltExpiry)u.dmltExpiry=new Date(dto.dmltExpiry);
      if(dto.lastLocationTime)u.lastLocationTime=new Date(dto.lastLocationTime);
      return await this.prisma.fieldAgent.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,active]=await Promise.all([this.prisma.fieldAgent.count({where:{tenantId}}),this.prisma.fieldAgent.count({where:{tenantId,status:'active'}})]);
      return { total, active };
    } catch { return { total: 0, active: 0 }; }
  }
}
