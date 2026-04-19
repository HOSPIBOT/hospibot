import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// PC-PNDT Act 1994 (amended 2003) — Sonologist/Imaging Specialist
// Qualified: MBBS + PG in Radiology (MD/DNB/DMRD/DMRE) OR 6-month USG course
// 2-place rule: Sonologist can visit max 2 places in one district (Gazette 5 June 2012)
// Form F mandatory for ALL pregnant patient USG scans
// PCPNDT registration certificate must be displayed, machine serial numbers listed

@Injectable()
export class SonologistPanelService {
  private readonly logger = new Logger(SonologistPanelService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, specialization, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (specialization) where.specialization = specialization;
      if (search) { where.OR = [{ sonologistName: { contains: search, mode: 'insensitive' } }, { mciRegistration: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.sonologistPanel.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.sonologistPanel.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.sonologistPanel.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.sonologistName) throw new BadRequestException('Sonologist name required');
      if (!dto.mciRegistration) throw new BadRequestException('MCI/State Council registration number mandatory per PC-PNDT');
      if (!dto.qualification) throw new BadRequestException('Qualification required — must be MBBS + PG Radiology or 6-month USG course');

      // Validate 2-place rule
      if (dto.placesRegistered && Number(dto.placesRegistered) > 2) {
        throw new BadRequestException('PC-PNDT 2-place rule: Sonologist can visit max 2 places in one district');
      }

      return await this.prisma.sonologistPanel.create({
        data: {
          tenantId, sonologistName: dto.sonologistName,
          qualification: dto.qualification, specialization: dto.specialization || null,
          mciRegistration: dto.mciRegistration,
          pcpndtRegistration: dto.pcpndtRegistration || null,
          pcpndtRegExpiry: dto.pcpndtRegExpiry ? new Date(dto.pcpndtRegExpiry) : null,
          placesRegistered: dto.placesRegistered ? Number(dto.placesRegistered) : 1,
          place1Name: dto.place1Name || null, place1District: dto.place1District || null,
          place2Name: dto.place2Name || null, place2District: dto.place2District || null,
          machinesRegistered: dto.machinesRegistered || null,
          locumDoctor: dto.locumDoctor || false,
          locumApprovalDate: dto.locumApprovalDate ? new Date(dto.locumApprovalDate) : null,
          weeklySchedule: dto.weeklySchedule || null,
          dailyScanLimit: dto.dailyScanLimit ? Number(dto.dailyScanLimit) : null,
          currentDayScans: 0,
          formFCompliance: dto.formFCompliance || true,
          quarterlyReportsDue: dto.quarterlyReportsDue || null,
          phone: dto.phone || null, email: dto.email || null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.sonologistPanel.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      if (dto.placesRegistered && Number(dto.placesRegistered) > 2) {
        throw new BadRequestException('PC-PNDT 2-place rule violation');
      }
      const updateData: any = {};
      const fields = ['sonologistName', 'qualification', 'specialization', 'mciRegistration',
        'pcpndtRegistration', 'place1Name', 'place1District', 'place2Name', 'place2District',
        'machinesRegistered', 'locumDoctor', 'weeklySchedule', 'formFCompliance',
        'quarterlyReportsDue', 'phone', 'email', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['placesRegistered', 'dailyScanLimit', 'currentDayScans'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.pcpndtRegExpiry) updateData.pcpndtRegExpiry = new Date(dto.pcpndtRegExpiry);
      if (dto.locumApprovalDate) updateData.locumApprovalDate = new Date(dto.locumApprovalDate);
      return await this.prisma.sonologistPanel.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, active, locums] = await Promise.all([
        this.prisma.sonologistPanel.count({ where: { tenantId } }),
        this.prisma.sonologistPanel.count({ where: { tenantId, status: 'active' } }),
        this.prisma.sonologistPanel.count({ where: { tenantId, locumDoctor: true } }),
      ]);
      return { total, activeSonologists: active, locumDoctors: locums };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, activeSonologists: 0, locumDoctors: 0 }; }
  }
}
