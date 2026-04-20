import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
// OB Growth Scan — fetal biometry, DICOM Supplement 26
// PC-PNDT Form F mandatory for obstetric USG in India
@Injectable()
export class ObGrowthScanService {
  private readonly logger = new Logger(ObGrowthScanService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{patientName:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.obGrowthScan.findMany({where,orderBy:{scanDate:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.obGrowthScan.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.obGrowthScan.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      if(!dto.patientName)throw new BadRequestException('Patient name required');
      if(!dto.pndtFormFCompleted)this.logger.warn('PC-PNDT Form F not completed — regulatory requirement for obstetric USG');
      return await this.prisma.obGrowthScan.create({ data: {
        tenantId, patientId: dto.patientId||null, patientName: dto.patientName,
        patientAge: dto.patientAge?Number(dto.patientAge):null,
        scanDate: dto.scanDate?new Date(dto.scanDate):new Date(),
        gestationalWeeks: dto.gestationalWeeks?Number(dto.gestationalWeeks):null,
        gestationalDays: dto.gestationalDays?Number(dto.gestationalDays):null,
        lmpDate: dto.lmpDate?new Date(dto.lmpDate):null, eddDate: dto.eddDate?new Date(dto.eddDate):null,
        scanType: dto.scanType||null, fetusCount: dto.fetusCount?Number(dto.fetusCount):1,
        bpd: dto.bpd?Number(dto.bpd):null, hc: dto.hc?Number(dto.hc):null,
        ac: dto.ac?Number(dto.ac):null, fl: dto.fl?Number(dto.fl):null,
        efw: dto.efw?Number(dto.efw):null, efwPercentile: dto.efwPercentile?Number(dto.efwPercentile):null,
        afiCm: dto.afiCm?Number(dto.afiCm):null,
        placentaPosition: dto.placentaPosition||null, placentaGrade: dto.placentaGrade||null,
        presentation: dto.presentation||null, fetalHeartRate: dto.fetalHeartRate?Number(dto.fetalHeartRate):null,
        cervicalLength: dto.cervicalLength?Number(dto.cervicalLength):null,
        umbilicalArteryPi: dto.umbilicalArteryPi?Number(dto.umbilicalArteryPi):null,
        mcaPi: dto.mcaPi?Number(dto.mcaPi):null, cprRatio: dto.cprRatio?Number(dto.cprRatio):null,
        growthRestriction: dto.growthRestriction||false, anomalyDetected: dto.anomalyDetected||false,
        anomalyDetails: dto.anomalyDetails||null,
        referringDoctor: dto.referringDoctor||null, sonologist: dto.sonologist||null,
        pndtFormFCompleted: dto.pndtFormFCompleted||false,
        notes: dto.notes||null, status: dto.status||'completed', createdBy: userId,
      }});
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.obGrowthScan.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u:any={};
      ['patientName','scanType','placentaPosition','placentaGrade','presentation','growthRestriction','anomalyDetected','anomalyDetails','referringDoctor','sonologist','pndtFormFCompleted','notes','status'].forEach(f=>{if(dto[f]!==undefined)u[f]=dto[f]});
      ['patientAge','gestationalWeeks','gestationalDays','fetusCount','bpd','hc','ac','fl','efw','efwPercentile','afiCm','fetalHeartRate','cervicalLength','umbilicalArteryPi','mcaPi','cprRatio'].forEach(f=>{if(dto[f]!==undefined)u[f]=Number(dto[f])});
      ['scanDate','lmpDate','eddDate'].forEach(f=>{if(dto[f])u[f]=new Date(dto[f])});
      return await this.prisma.obGrowthScan.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const [total,iugr,anomaly]=await Promise.all([this.prisma.obGrowthScan.count({where:{tenantId}}),this.prisma.obGrowthScan.count({where:{tenantId,growthRestriction:true}}),this.prisma.obGrowthScan.count({where:{tenantId,anomalyDetected:true}})]);
      return { total, iugrCases: iugr, anomaliesDetected: anomaly };
    } catch { return { total: 0, iugrCases: 0, anomaliesDetected: 0 }; }
  }
}
