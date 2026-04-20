import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// OCT (Optical Coherence Tomography)
// Non-invasive retinal/optic nerve imaging
// Key: RNFL thickness, macular thickness (ETDRS 9-zone grid)
// GCIPL/GCC for glaucoma, DME monitoring for diabetic retinopathy
// Signal strength >5 for valid scan

@Injectable()
export class OctScansService {
  private readonly logger = new Logger(OctScansService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, scanProtocol, status, search } = query;
      const where: any = { tenantId };
      if (scanProtocol) where.scanProtocol = scanProtocol;
      if (status) where.status = status;
      if (search) { where.OR = [{ patientName: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.octScan.findMany({ where, orderBy: { scanDate: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.octScan.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.octScan.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.patientName) throw new BadRequestException('Patient name required');
      if (!dto.eye) throw new BadRequestException('Eye required (OD/OS/OU)');
      const signalOk = dto.signalStrength ? Number(dto.signalStrength) >= 5 : null;
      return await this.prisma.octScan.create({
        data: {
          tenantId, patientId: dto.patientId || null, patientName: dto.patientName,
          patientAge: dto.patientAge ? Number(dto.patientAge) : null, patientGender: dto.patientGender || null,
          eye: dto.eye, scanDate: dto.scanDate ? new Date(dto.scanDate) : new Date(),
          scanProtocol: dto.scanProtocol || null,
          referringDoctor: dto.referringDoctor || null, clinicalIndication: dto.clinicalIndication || null,
          // Equipment
          platform: dto.platform || null, deviceModel: dto.deviceModel || null,
          signalStrength: dto.signalStrength ? Number(dto.signalStrength) : null,
          signalAdequate: signalOk,
          // RNFL
          rnflAvg: dto.rnflAvg ? Number(dto.rnflAvg) : null,
          rnflSuperior: dto.rnflSuperior ? Number(dto.rnflSuperior) : null,
          rnflInferior: dto.rnflInferior ? Number(dto.rnflInferior) : null,
          rnflNasal: dto.rnflNasal ? Number(dto.rnflNasal) : null,
          rnflTemporal: dto.rnflTemporal ? Number(dto.rnflTemporal) : null,
          rnflClassification: dto.rnflClassification || null,
          // Macular (ETDRS 9-zone)
          centralSubfieldThickness: dto.centralSubfieldThickness ? Number(dto.centralSubfieldThickness) : null,
          macularVolume: dto.macularVolume ? Number(dto.macularVolume) : null,
          macularThicknessMap: dto.macularThicknessMap || null,
          // GCC/GCIPL
          gccAvg: dto.gccAvg ? Number(dto.gccAvg) : null,
          gciplAvg: dto.gciplAvg ? Number(dto.gciplAvg) : null,
          // Disc
          cupDiscRatio: dto.cupDiscRatio ? Number(dto.cupDiscRatio) : null,
          discArea: dto.discArea ? Number(dto.discArea) : null,
          rimArea: dto.rimArea ? Number(dto.rimArea) : null,
          // Findings
          findings: dto.findings || null, diagnosis: dto.diagnosis || null,
          subretinalFluid: dto.subretinalFluid || false,
          intraretinalFluid: dto.intraretinalFluid || false,
          pigmentEpithelialDetachment: dto.pigmentEpithelialDetachment || false,
          epiretinalMembrane: dto.epiretinalMembrane || false,
          maculaEdema: dto.maculaEdema || false,
          progressionFromPrior: dto.progressionFromPrior || null,
          interpretedBy: dto.interpretedBy || null,
          notes: dto.notes || null, status: dto.status || 'completed',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.octScan.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['patientName', 'patientGender', 'eye', 'scanProtocol', 'referringDoctor',
        'clinicalIndication', 'platform', 'deviceModel', 'signalAdequate', 'rnflClassification',
        'findings', 'diagnosis', 'subretinalFluid', 'intraretinalFluid', 'pigmentEpithelialDetachment',
        'epiretinalMembrane', 'maculaEdema', 'progressionFromPrior', 'interpretedBy', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['patientAge', 'signalStrength', 'rnflAvg', 'rnflSuperior', 'rnflInferior',
        'rnflNasal', 'rnflTemporal', 'centralSubfieldThickness', 'macularVolume', 'gccAvg',
        'gciplAvg', 'cupDiscRatio', 'discArea', 'rimArea'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.scanDate) updateData.scanDate = new Date(dto.scanDate);
      if (dto.macularThicknessMap) updateData.macularThicknessMap = dto.macularThicknessMap;
      return await this.prisma.octScan.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, byProtocol, edemaCount] = await Promise.all([
        this.prisma.octScan.count({ where: { tenantId } }),
        this.prisma.octScan.groupBy({ by: ['scanProtocol'], where: { tenantId }, _count: true }),
        this.prisma.octScan.count({ where: { tenantId, maculaEdema: true } }),
      ]);
      return { total, macularEdemaDetected: edemaCount, byProtocol: byProtocol.filter(p => p.scanProtocol).map(p => ({ protocol: p.scanProtocol, count: p._count })) };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, macularEdemaDetected: 0, byProtocol: [] }; }
  }
}
