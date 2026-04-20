import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// OPG (Orthopantomogram) = 2D panoramic jaw X-ray
// CBCT (Cone Beam CT) = 3D volumetric dental/maxillofacial imaging
// AERB licensing required for dental X-ray equipment
// CBCT dose ~36 µSv vs conventional CT 2000-4000 µSv

@Injectable()
export class OpgCbctService {
  private readonly logger = new Logger(OpgCbctService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, scanType, status, search } = query;
      const where: any = { tenantId };
      if (scanType) where.scanType = scanType;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.opgCbctScan.findMany({ where, orderBy: { scanDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.opgCbctScan.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.opgCbctScan.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.scanType) throw new BadRequestException('Scan type required (opg/cbct/cephalogram/bitewing)');
      return await this.prisma.opgCbctScan.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null, patientGender: dto.patientGender || null,
          scanType: dto.scanType, scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
          referringDentist: dto.referringDentist || null, referringSpecialty: dto.referringSpecialty || null,
          clinicalIndication: dto.clinicalIndication || null,
          // Equipment
          equipmentName: dto.equipmentName || null, equipmentMake: dto.equipmentMake || null,
          // CBCT specific
          fieldOfView: dto.fieldOfView || null, voxelSize: dto.voxelSize || null,
          kvp: dto.kvp ? Number(dto.kvp) : null, mA: dto.mA ? Number(dto.mA) : null,
          exposureTime: dto.exposureTime ? Number(dto.exposureTime) : null,
          doseEstimateMicroSv: dto.doseEstimateMicroSv ? Number(dto.doseEstimateMicroSv) : null,
          // Region
          regionScanned: dto.regionScanned || null,
          teethInvolved: dto.teethInvolved || null,
          // Findings
          findings: dto.findings || null,
          pathologyDetected: dto.pathologyDetected || null,
          boneQuality: dto.boneQuality || null,
          implantSiteAssessment: dto.implantSiteAssessment || null,
          nerveCanalProximity: dto.nerveCanalProximity || null,
          sinusAssessment: dto.sinusAssessment || null,
          tmjAssessment: dto.tmjAssessment || null,
          // Reporting
          reportedBy: dto.reportedBy || null, reporterQualification: dto.reporterQualification || null,
          reportDate: dto.reportDate ? new Date(dto.reportDate) : null,
          pregnancyScreenDone: dto.pregnancyScreenDone || false,
          leadApronUsed: dto.leadApronUsed || false, thyroidShieldUsed: dto.thyroidShieldUsed || false,
          notes: dto.notes || null, status: dto.status || 'pending',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.opgCbctScan.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'scanType', 'referringDentist', 'referringSpecialty',
        'clinicalIndication', 'equipmentName', 'equipmentMake', 'fieldOfView', 'voxelSize',
        'regionScanned', 'teethInvolved', 'findings', 'pathologyDetected', 'boneQuality',
        'implantSiteAssessment', 'nerveCanalProximity', 'sinusAssessment', 'tmjAssessment',
        'reportedBy', 'reporterQualification', 'pregnancyScreenDone', 'leadApronUsed',
        'thyroidShieldUsed', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'kvp', 'mA', 'exposureTime', 'doseEstimateMicroSv'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.scanDate) updateData.scanDate = new Date(dto.scanDate);
      if (dto.reportDate) updateData.reportDate = new Date(dto.reportDate);
      return await this.prisma.opgCbctScan.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byType] = await Promise.all([
        this.prisma.opgCbctScan.count({ where: { tenantId } }),
        this.prisma.opgCbctScan.groupBy({ by: ['scanType'], where: { tenantId }, _count: true }),
      ]);
      return { total, byType: byType.map(t => ({ type: t.scanType, count: t._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, byType: [] }; }
  }
}
