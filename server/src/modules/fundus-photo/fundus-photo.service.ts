import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Fundus photography for retinal imaging
// DR grading: No DR / Mild NPDR / Moderate NPDR / Severe NPDR / PDR
// ETDRS 7-field standard photography
// Non-mydriatic vs mydriatic camera
// Diabetic retinopathy screening per RSSDI/ICO guidelines

@Injectable()
export class FundusPhotoService {
  private readonly logger = new Logger(FundusPhotoService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, drGrade, eye, search } = query;
      const where: any = { tenantId };
      if (drGrade) where.drGrade = drGrade;
      if (eye) where.eye = eye;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.fundusPhoto.findMany({ where, orderBy: { photoDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.fundusPhoto.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.fundusPhoto.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.eye) throw new BadRequestException('Eye required (OD/OS/OU)');
      return await this.prisma.fundusPhoto.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null, patientGender: dto.patientGender || null,
          eye: dto.eye, photoDate: dto.photoDate ? new Date(dto.photoDate) : new Date(),
          cameraType: dto.cameraType || null, mydriatic: dto.mydriatic || false,
          imageQuality: dto.imageQuality || null, numberOfFields: dto.numberOfFields ? Number(dto.numberOfFields) : null,
          referringDoctor: dto.referringDoctor || null, clinicalIndication: dto.clinicalIndication || null,
          diabetesStatus: dto.diabetesStatus || null, diabetesDurationYears: dto.diabetesDurationYears ? Number(dto.diabetesDurationYears) : null,
          lastHba1c: dto.lastHba1c ? Number(dto.lastHba1c) : null,
          // DR grading (ETDRS/ICO scale)
          drGrade: dto.drGrade || null,
          dmePresent: dto.dmePresent || false,
          // Findings
          microaneurysms: dto.microaneurysms || false,
          hemorrhages: dto.hemorrhages || false, hemorrhageType: dto.hemorrhageType || null,
          hardExudates: dto.hardExudates || false,
          cottonWoolSpots: dto.cottonWoolSpots || false,
          venousBeading: dto.venousBeading || false,
          irma: dto.irma || false,
          neovascularization: dto.neovascularization || false, nvLocation: dto.nvLocation || null,
          vitreousHemorrhage: dto.vitreousHemorrhage || false,
          tractionalDetachment: dto.tractionalDetachment || false,
          // Optic disc
          discEdema: dto.discEdema || false, discPallor: dto.discPallor || false,
          cupDiscRatio: dto.cupDiscRatio ? Number(dto.cupDiscRatio) : null,
          // Macula
          macularEdema: dto.macularEdema || false, fovealReflex: dto.fovealReflex || null,
          // Other
          otherFindings: dto.otherFindings || null,
          referralRecommended: dto.referralRecommended || false, referralTo: dto.referralTo || null,
          treatmentRecommended: dto.treatmentRecommended || null,
          gradedBy: dto.gradedBy || null,
          screeningProgram: dto.screeningProgram || null,
          notes: dto.notes || null, status: dto.status || 'completed',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.fundusPhoto.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'eye', 'cameraType', 'mydriatic', 'imageQuality',
        'referringDoctor', 'clinicalIndication', 'diabetesStatus', 'drGrade', 'dmePresent',
        'microaneurysms', 'hemorrhages', 'hemorrhageType', 'hardExudates', 'cottonWoolSpots',
        'venousBeading', 'irma', 'neovascularization', 'nvLocation', 'vitreousHemorrhage',
        'tractionalDetachment', 'discEdema', 'discPallor', 'macularEdema', 'fovealReflex',
        'otherFindings', 'referralRecommended', 'referralTo', 'treatmentRecommended',
        'gradedBy', 'screeningProgram', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'numberOfFields', 'diabetesDurationYears', 'lastHba1c', 'cupDiscRatio'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.photoDate) updateData.photoDate = new Date(dto.photoDate);
      return await this.prisma.fundusPhoto.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byGrade, dme] = await Promise.all([
        this.prisma.fundusPhoto.count({ where: { tenantId } }),
        this.prisma.fundusPhoto.groupBy({ by: ['drGrade'], where: { tenantId }, _count: true }),
        this.prisma.fundusPhoto.count({ where: { tenantId, dmePresent: true } }),
      ]);
      return { total, dmeDetected: dme, byDrGrade: byGrade.filter(g => g.drGrade).map(g => ({ grade: g.drGrade, count: g._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, dmeDetected: 0, byDrGrade: [] }; }
  }
}
