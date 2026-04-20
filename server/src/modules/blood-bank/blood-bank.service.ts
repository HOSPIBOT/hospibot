import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
@Injectable()
export class BloodBankService {
  private readonly logger = new Logger(BloodBankService.name);
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, query: any) {
    try {
      const { page=1, limit=20, status, search } = query;
      const where: any = { tenantId }; if(status)where.status=status;
      if(search){where.OR=[{entryType:{contains:search,mode:'insensitive'}}]}
      const [data,total]=await Promise.all([this.prisma.bloodBankEntry.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:Number(limit)}),this.prisma.bloodBankEntry.count({where})]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch { return { data: [], total: 0, page: 1, limit: 20 }; }
  }
  async findOne(tenantId: string, id: string) { try { return await this.prisma.bloodBankEntry.findFirst({ where: { id, tenantId } }); } catch { return null; } }
  async create(tenantId: string, dto: any, userId: string) {
    try {
      const data: any = { tenantId, createdBy: userId };
            if(dto.donorName!==undefined)data.donorName=dto.donorName;
      if(dto.donorGender!==undefined)data.donorGender=dto.donorGender;
      if(dto.donorBloodGroup!==undefined)data.donorBloodGroup=dto.donorBloodGroup;
      if(dto.bagNumber!==undefined)data.bagNumber=dto.bagNumber;
      if(dto.componentType!==undefined)data.componentType=dto.componentType;
      if(dto.screeningHiv!==undefined)data.screeningHiv=dto.screeningHiv;
      if(dto.screeningHbsag!==undefined)data.screeningHbsag=dto.screeningHbsag;
      if(dto.screeningHcv!==undefined)data.screeningHcv=dto.screeningHcv;
      if(dto.screeningSyphilis!==undefined)data.screeningSyphilis=dto.screeningSyphilis;
      if(dto.screeningMalaria!==undefined)data.screeningMalaria=dto.screeningMalaria;
      if(dto.crossMatchPatient!==undefined)data.crossMatchPatient=dto.crossMatchPatient;
      if(dto.crossMatchResult!==undefined)data.crossMatchResult=dto.crossMatchResult;
      if(dto.issuedTo!==undefined)data.issuedTo=dto.issuedTo;
            if(dto.donorAge!==undefined)data.donorAge=Number(dto.donorAge);
      if(dto.donorHb!==undefined)data.donorHb=Number(dto.donorHb);
      if(dto.volumeMl!==undefined)data.volumeMl=Number(dto.volumeMl);
            if(dto.transfusionReaction!==undefined)data.transfusionReaction=!!dto.transfusionReaction;
      if(dto.nacoReported!==undefined)data.nacoReported=!!dto.nacoReported;
            if(dto.donationDate)data.donationDate=new Date(dto.donationDate);
      if(dto.expiryDate)data.expiryDate=new Date(dto.expiryDate);
      if(dto.issueDate)data.issueDate=new Date(dto.issueDate);
      
            data.entryType=dto.entryType||'';
      data.status=dto.status||'active';
      return await this.prisma.bloodBankEntry.create({ data });
    } catch(err){this.logger.error('create',err);throw err;}
  }
  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing=await this.prisma.bloodBankEntry.findFirst({where:{id,tenantId}});
      if(!existing)throw new BadRequestException('Not found');
      const u: any = {};
            if(dto.donorName!==undefined)u.donorName=dto.donorName;
      if(dto.donorGender!==undefined)u.donorGender=dto.donorGender;
      if(dto.donorBloodGroup!==undefined)u.donorBloodGroup=dto.donorBloodGroup;
      if(dto.bagNumber!==undefined)u.bagNumber=dto.bagNumber;
      if(dto.componentType!==undefined)u.componentType=dto.componentType;
      if(dto.screeningHiv!==undefined)u.screeningHiv=dto.screeningHiv;
      if(dto.screeningHbsag!==undefined)u.screeningHbsag=dto.screeningHbsag;
      if(dto.screeningHcv!==undefined)u.screeningHcv=dto.screeningHcv;
      if(dto.screeningSyphilis!==undefined)u.screeningSyphilis=dto.screeningSyphilis;
      if(dto.screeningMalaria!==undefined)u.screeningMalaria=dto.screeningMalaria;
      if(dto.crossMatchPatient!==undefined)u.crossMatchPatient=dto.crossMatchPatient;
      if(dto.crossMatchResult!==undefined)u.crossMatchResult=dto.crossMatchResult;
      if(dto.issuedTo!==undefined)u.issuedTo=dto.issuedTo;
      if(dto.entryType!==undefined)u.entryType=dto.entryType;
            if(dto.donorAge!==undefined)u.donorAge=Number(dto.donorAge);
      if(dto.donorHb!==undefined)u.donorHb=Number(dto.donorHb);
      if(dto.volumeMl!==undefined)u.volumeMl=Number(dto.volumeMl);
            if(dto.transfusionReaction!==undefined)u.transfusionReaction=!!dto.transfusionReaction;
      if(dto.nacoReported!==undefined)u.nacoReported=!!dto.nacoReported;
            if(dto.donationDate)u.donationDate=new Date(dto.donationDate);
      if(dto.expiryDate)u.expiryDate=new Date(dto.expiryDate);
      if(dto.issueDate)u.issueDate=new Date(dto.issueDate);
      
      if(dto.status)u.status=dto.status;
      return await this.prisma.bloodBankEntry.update({where:{id},data:u});
    } catch(err){this.logger.error('update',err);throw err;}
  }
  async getStats(tenantId: string) {
    try {
      const total=await this.prisma.bloodBankEntry.count({where:{tenantId}});
      return { total };
    } catch { return { total: 0 }; }
  }
}
