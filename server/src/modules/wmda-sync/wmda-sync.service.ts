import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// WMDA (World Marrow Donor Association) sync
// India: DATRI (largest Indian stem cell donor registry)
// HLA matching, donor search → match → workup → collection → transplant
@Injectable()
export class WmdaSyncService {
  private readonly logger = new Logger(WmdaSyncService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, searchStatus, search } = query;
      const where: any = { tenantId }; if(searchStatus)where.searchStatus=searchStatus;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}},{donorId:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.wmdaSearch.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.wmdaSearch.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.wmdaSearch.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.patientName)throw new BadRequestException('Patient name required');
      return await this.prisma.wmdaSearch.create({ data: {
        tenantId, patientId:dto.patientId||null, patientName:dto.patientName,
        patientAge:dto.patientAge?Number(dto.patientAge):null, diagnosis:dto.diagnosis||null,
        urgency:dto.urgency||null, hlaTyping:dto.hlaTyping||null,
        hlaA:dto.hlaA||null, hlaB:dto.hlaB||null, hlaC:dto.hlaC||null,
        hlaDRB1:dto.hlaDRB1||null, hlaDQB1:dto.hlaDQB1||null,
        registrySearched:dto.registrySearched||null, registryName:dto.registryName||null,
        searchDate:dto.searchDate?new Date(dto.searchDate):new Date(),
        matchesFound:dto.matchesFound?Number(dto.matchesFound):null,
        bestMatchScore:dto.bestMatchScore||null,
        donorId:dto.donorId||null, donorRegistryId:dto.donorRegistryId||null,
        donorAge:dto.donorAge?Number(dto.donorAge):null, donorGender:dto.donorGender||null,
        donorHlaMatch:dto.donorHlaMatch||null,
        workupRequested:dto.workupRequested||false, workupDate:dto.workupDate?new Date(dto.workupDate):null,
        collectionDate:dto.collectionDate?new Date(dto.collectionDate):null,
        collectionType:dto.collectionType||null,
        transplantDate:dto.transplantDate?new Date(dto.transplantDate):null,
        coordinatorName:dto.coordinatorName||null, transplantCenter:dto.transplantCenter||null,
        searchStatus:dto.searchStatus||'searching',
        notes:dto.notes||null, status:dto.status||'active', createdBy:userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.wmdaSearch.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['patientName','diagnosis','urgency','hlaTyping','hlaA','hlaB','hlaC','hlaDRB1','hlaDQB1','registrySearched','registryName','bestMatchScore','donorId','donorRegistryId','donorGender','donorHlaMatch','workupRequested','collectionType','coordinatorName','transplantCenter','searchStatus','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['patientAge','matchesFound','donorAge'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['searchDate','workupDate','collectionDate','transplantDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.wmdaSearch.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byStatus]=await Promise.all([this.prisma.wmdaSearch.count({where:{tenantId}}),this.prisma.wmdaSearch.groupBy({by:['searchStatus'],where:{tenantId},_count:true})]);
      return { total, byStatus: byStatus.map(s=>({status:s.searchStatus,count:s._count})) };
    } catch { return { total: 0, byStatus: [] }; }
  }
}
