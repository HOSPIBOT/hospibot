import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class RoutePlanningService {
  private readonly logger = new Logger(RoutePlanningService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{routeName:{contains:search,mode:'insensitive'}},{agentName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.routePlan.findMany({where,orderBy:{routeDate:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.routePlan.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.routePlan.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.routeName)throw new BadRequestException('Route name required');
      if(!dto.routeDate)throw new BadRequestException('Route date required');
      return await this.prisma.routePlan.create({ data: {
        tenantId, routeName: dto.routeName, routeDate: new Date(dto.routeDate),
        agentId: dto.agentId||null, agentName: dto.agentName||null, zone: dto.zone||null,
        startLocation: dto.startLocation||null, totalStops: dto.totalStops?Number(dto.totalStops):null,
        totalSamples: dto.totalSamples?Number(dto.totalSamples):null,
        stops: dto.stops||null, estimatedKm: dto.estimatedKm?Number(dto.estimatedKm):null,
        estimatedTimeMin: dto.estimatedTimeMin?Number(dto.estimatedTimeMin):null,
        notes: dto.notes||null, status: dto.status||'planned', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.routePlan.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['routeName','agentId','agentName','zone','startLocation','coldChainMaintained','handoverTo','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['totalStops','completedStops','totalSamples','collectedSamples','estimatedTimeMin','actualTimeMin'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['estimatedKm','actualKm'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['routeDate','departureTime','completionTime','handoverTime'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      if(dto.stops)u.stops=dto.stops;
      return await this.prisma.routePlan.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byStatus]=await Promise.all([this.prisma.routePlan.count({where:{tenantId}}),this.prisma.routePlan.groupBy({by:['status'],where:{tenantId},_count:true})]);
      return { total, byStatus: byStatus.map(s=>({status:s.status,count:s._count})) };
    } catch { return { total: 0, byStatus: [] }; }
  }
}
