import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// Direct-to-Consumer (DTC) diagnostic testing
// Consumer-initiated ordering, home collection, digital results
// DPDPA 2023: consumer data privacy, consent management
// Workflow: order → payment → collection → processing → results → follow-up
@Injectable()
export class DtcConsumerService {
  private readonly logger = new Logger(DtcConsumerService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, orderStatus, search } = query;
      const where: any = { tenantId }; if(orderStatus)where.orderStatus=orderStatus;
      if(search){where.OR=[{consumerName:{contains:search,mode:'insensitive'}},{orderNumber:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.dtcOrder.findMany({where,orderBy:{orderDate:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.dtcOrder.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.dtcOrder.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.consumerName)throw new BadRequestException('Consumer name required');
      if(!dto.consumerPhone)throw new BadRequestException('Consumer phone required');
      return await this.prisma.dtcOrder.create({ data: {
        tenantId, orderNumber: dto.orderNumber||`DTC-${Date.now()}`,
        consumerName: dto.consumerName, consumerPhone: dto.consumerPhone,
        consumerEmail: dto.consumerEmail||null,
        consumerAge: dto.consumerAge?Number(dto.consumerAge):null,
        consumerGender: dto.consumerGender||null,
        consumerAddress: dto.consumerAddress||null,
        consumerCity: dto.consumerCity||null, consumerPincode: dto.consumerPincode||null,
        // Order
        orderDate: dto.orderDate?new Date(dto.orderDate):new Date(),
        orderSource: dto.orderSource||'website',
        packageName: dto.packageName||null, testsOrdered: dto.testsOrdered||null,
        testCount: dto.testCount?Number(dto.testCount):null,
        // Collection
        collectionType: dto.collectionType||'home-collection',
        collectionDate: dto.collectionDate?new Date(dto.collectionDate):null,
        collectionTimeSlot: dto.collectionTimeSlot||null,
        phlebotomistAssigned: dto.phlebotomistAssigned||null,
        sampleCollected: dto.sampleCollected||false,
        sampleBarcode: dto.sampleBarcode||null,
        // Consent (DPDPA 2023)
        consentGiven: dto.consentGiven||false,
        consentDate: dto.consentDate?new Date(dto.consentDate):null,
        dataProcessingConsent: dto.dataProcessingConsent||false,
        marketingConsent: dto.marketingConsent||false,
        // Payment
        totalAmount: dto.totalAmount?Number(dto.totalAmount):null,
        discountAmount: dto.discountAmount?Number(dto.discountAmount):null,
        netAmount: dto.netAmount?Number(dto.netAmount):null,
        paymentMethod: dto.paymentMethod||null,
        paymentStatus: dto.paymentStatus||'pending',
        paymentDate: dto.paymentDate?new Date(dto.paymentDate):null,
        transactionId: dto.transactionId||null,
        // Results
        resultsReady: dto.resultsReady||false,
        resultsDeliveredVia: dto.resultsDeliveredVia||null,
        resultsDeliveredDate: dto.resultsDeliveredDate?new Date(dto.resultsDeliveredDate):null,
        abnormalResults: dto.abnormalResults||false,
        followUpRecommended: dto.followUpRecommended||false,
        followUpDoctorName: dto.followUpDoctorName||null,
        // Feedback
        customerRating: dto.customerRating?Number(dto.customerRating):null,
        customerFeedback: dto.customerFeedback||null,
        // Referral/promo
        promoCode: dto.promoCode||null, referralSource: dto.referralSource||null,
        notes: dto.notes||null, orderStatus: dto.orderStatus||'placed', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.dtcOrder.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['orderNumber','consumerName','consumerPhone','consumerEmail','consumerGender','consumerAddress','consumerCity','consumerPincode','orderSource','packageName','collectionType','collectionTimeSlot','phlebotomistAssigned','sampleCollected','sampleBarcode','consentGiven','dataProcessingConsent','marketingConsent','paymentMethod','paymentStatus','transactionId','resultsReady','resultsDeliveredVia','abnormalResults','followUpRecommended','followUpDoctorName','customerFeedback','promoCode','referralSource','notes','orderStatus'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['consumerAge','testCount','totalAmount','discountAmount','netAmount','customerRating'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['orderDate','collectionDate','consentDate','paymentDate','resultsDeliveredDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      if(dto.testsOrdered)u.testsOrdered=dto.testsOrdered;
      return await this.prisma.dtcOrder.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,byStatus,abnormal]=await Promise.all([this.prisma.dtcOrder.count({where:{tenantId}}),this.prisma.dtcOrder.groupBy({by:['orderStatus'],where:{tenantId},_count:true}),this.prisma.dtcOrder.count({where:{tenantId,abnormalResults:true}})]);
      return { total, abnormalResults: abnormal, byStatus: byStatus.map(s=>({status:s.orderStatus,count:s._count})) };
    } catch { return { total: 0, abnormalResults: 0, byStatus: [] }; }
  }
}
