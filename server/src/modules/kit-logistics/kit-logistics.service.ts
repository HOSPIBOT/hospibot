import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// NABL 112A / ISO 15189:2022 Clause 6.6 — Reagents & Consumables
// FEFO (First Expire First Out), lot tracking, cold chain
// Acceptance testing per lot, CoA verification, segregation
// Categories: disposable, durable, bulk chemical (reagents/calibrators/controls)
@Injectable()
export class KitLogisticsService {
  private readonly logger = new Logger(KitLogisticsService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, category, status, search } = query;
      const where: any = { tenantId }; if(category)where.category=category; if(status)where.status=status;
      if(search){where.OR=[{itemName:{contains:search,mode:'insensitive'}},{lotNumber:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.kitInventory.findMany({where,orderBy:{expiryDate:'asc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.kitInventory.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.kitInventory.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.itemName)throw new BadRequestException('Item name required');
      // Auto-flag expiry alerts
      let expiryAlert = null;
      if(dto.expiryDate) {
        const exp = new Date(dto.expiryDate);
        const now = new Date();
        const daysToExpiry = Math.floor((exp.getTime()-now.getTime())/(1000*60*60*24));
        expiryAlert = daysToExpiry <= 0 ? 'expired' : daysToExpiry <= 30 ? 'critical' : daysToExpiry <= 90 ? 'warning' : 'ok';
      }
      return await this.prisma.kitInventory.create({ data: {
        tenantId, itemName: dto.itemName, itemCode: dto.itemCode||null,
        category: dto.category||'reagent',
        itemType: dto.itemType||null,
        manufacturer: dto.manufacturer||null, supplier: dto.supplier||null,
        catalogNumber: dto.catalogNumber||null,
        // Lot tracking (NABL 112A §6.6)
        lotNumber: dto.lotNumber||null, batchNumber: dto.batchNumber||null,
        manufacturingDate: dto.manufacturingDate?new Date(dto.manufacturingDate):null,
        expiryDate: dto.expiryDate?new Date(dto.expiryDate):null,
        expiryAlert: expiryAlert,
        // Inventory
        quantityReceived: dto.quantityReceived?Number(dto.quantityReceived):null,
        quantityOnHand: dto.quantityOnHand?Number(dto.quantityOnHand):null,
        quantityUsed: dto.quantityUsed?Number(dto.quantityUsed):0,
        unitOfMeasure: dto.unitOfMeasure||null,
        reorderLevel: dto.reorderLevel?Number(dto.reorderLevel):null,
        reorderQuantity: dto.reorderQuantity?Number(dto.reorderQuantity):null,
        // Storage (ISO 15189)
        storageCondition: dto.storageCondition||null,
        storageTemperatureMin: dto.storageTemperatureMin?Number(dto.storageTemperatureMin):null,
        storageTemperatureMax: dto.storageTemperatureMax?Number(dto.storageTemperatureMax):null,
        coldChainRequired: dto.coldChainRequired||false,
        storageLocation: dto.storageLocation||null,
        // Acceptance testing
        coaVerified: dto.coaVerified||false,
        acceptanceTestDone: dto.acceptanceTestDone||false,
        acceptanceTestResult: dto.acceptanceTestResult||null,
        acceptanceTestDate: dto.acceptanceTestDate?new Date(dto.acceptanceTestDate):null,
        // Segregation status
        segregationStatus: dto.segregationStatus||'untested',
        // Receipt
        receivedDate: dto.receivedDate?new Date(dto.receivedDate):null,
        receivedBy: dto.receivedBy||null,
        poNumber: dto.poNumber||null,
        unitCost: dto.unitCost?Number(dto.unitCost):null,
        totalCost: dto.totalCost?Number(dto.totalCost):null,
        // Linked equipment
        linkedEquipment: dto.linkedEquipment||null,
        linkedTest: dto.linkedTest||null,
        notes: dto.notes||null, status: dto.status||'in-stock', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.kitInventory.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['itemName','itemCode','category','itemType','manufacturer','supplier','catalogNumber','lotNumber','batchNumber','unitOfMeasure','storageCondition','coldChainRequired','storageLocation','coaVerified','acceptanceTestDone','acceptanceTestResult','segregationStatus','receivedBy','poNumber','linkedEquipment','linkedTest','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['quantityReceived','quantityOnHand','quantityUsed','reorderLevel','reorderQuantity','storageTemperatureMin','storageTemperatureMax','unitCost','totalCost'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['manufacturingDate','expiryDate','acceptanceTestDate','receivedDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      // Recalc expiry alert
      if(dto.expiryDate){const exp=new Date(dto.expiryDate);const d=Math.floor((exp.getTime()-Date.now())/(86400000));u.expiryAlert=d<=0?'expired':d<=30?'critical':d<=90?'warning':'ok';}
      return await this.prisma.kitInventory.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,expired,critical]=await Promise.all([this.prisma.kitInventory.count({where:{tenantId}}),this.prisma.kitInventory.count({where:{tenantId,expiryAlert:'expired'}}),this.prisma.kitInventory.count({where:{tenantId,expiryAlert:'critical'}})]);
      return { total, expiredItems: expired, criticalExpiry: critical };
    } catch { return { total: 0, expiredItems: 0, criticalExpiry: 0 }; }
  }
}
