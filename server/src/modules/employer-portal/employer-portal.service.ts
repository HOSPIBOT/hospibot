import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// India Labour Code 2020: mandatory annual checkup 40+, compliance documentation
// DPDPA 2023: anonymized aggregate reporting, no individual PII to employer
// B2B corporate client management

@Injectable()
export class EmployerPortalService {
  private readonly logger = new Logger(EmployerPortalService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const where: any = { tenantId };
      if (status) where.status = status;
      if (search) { where.OR = [{ employerName: { contains: search, mode: 'insensitive' } }, { contactPerson: { contains: search, mode: 'insensitive' } }]; }
      const [data, total] = await Promise.all([
        this.prisma.employerPortal.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: Number(limit) }),
        this.prisma.employerPortal.count({ where }),
      ]);
      return { data, total, page: Number(page), limit: Number(limit) };
    } catch (err) { this.logger.error('findAll error', err); return { data: [], total: 0, page: 1, limit: 20 }; }
  }

  async findOne(tenantId: string, id: string) {
    try { return await this.prisma.employerPortal.findFirst({ where: { id, tenantId } }); }
    catch (err) { this.logger.error('findOne error', err); return null; }
  }

  async create(tenantId: string, dto: any, userId: string) {
    try {
      if (!dto.employerName) throw new BadRequestException('Employer name required');
      return await this.prisma.employerPortal.create({
        data: {
          tenantId, employerName: dto.employerName,
          industryType: dto.industryType || null,
          gstin: dto.gstin || null,
          contactPerson: dto.contactPerson || null,
          contactPhone: dto.contactPhone || null, contactEmail: dto.contactEmail || null,
          address: dto.address || null, city: dto.city || null, state: dto.state || null,
          // Contract
          contractId: dto.contractId || null,
          contractStart: dto.contractStart ? new Date(dto.contractStart) : null,
          contractEnd: dto.contractEnd ? new Date(dto.contractEnd) : null,
          // Employee details
          totalEmployees: dto.totalEmployees ? Number(dto.totalEmployees) : null,
          employeesAbove40: dto.employeesAbove40 ? Number(dto.employeesAbove40) : null,
          screenedCount: dto.screenedCount ? Number(dto.screenedCount) : 0,
          pendingCount: dto.pendingCount ? Number(dto.pendingCount) : null,
          utilizationPct: dto.totalEmployees && dto.screenedCount ? Math.round((Number(dto.screenedCount) / Number(dto.totalEmployees)) * 100) : null,
          // Package
          packageName: dto.packageName || null,
          perEmployeeRate: dto.perEmployeeRate ? Number(dto.perEmployeeRate) : null,
          // Labour Code 2020 compliance
          labourCodeCompliant: dto.labourCodeCompliant || false,
          complianceCertIssued: dto.complianceCertIssued || false,
          complianceCertDate: dto.complianceCertDate ? new Date(dto.complianceCertDate) : null,
          factoriesActApplicable: dto.factoriesActApplicable || false,
          form32Submitted: dto.form32Submitted || false,
          form33Submitted: dto.form33Submitted || false,
          // Anonymized aggregate (DPDPA 2023 — no individual PII)
          aggregateReport: dto.aggregateReport || null,
          topRisks: dto.topRisks || null,
          abnormalPct: dto.abnormalPct ? Number(dto.abnormalPct) : null,
          // Portal access
          portalLoginEnabled: dto.portalLoginEnabled || false,
          portalUsername: dto.portalUsername || null,
          notes: dto.notes || null, status: dto.status || 'active',
          createdBy: userId,
        },
      });
    } catch (err) { this.logger.error('create error', err); throw err; }
  }

  async update(tenantId: string, id: string, dto: any) {
    try {
      const existing = await this.prisma.employerPortal.findFirst({ where: { id, tenantId } });
      if (!existing) throw new BadRequestException('Record not found');
      const updateData: any = {};
      const fields = ['employerName', 'industryType', 'gstin', 'contactPerson', 'contactPhone',
        'contactEmail', 'address', 'city', 'state', 'contractId', 'packageName',
        'labourCodeCompliant', 'complianceCertIssued', 'factoriesActApplicable',
        'form32Submitted', 'form33Submitted', 'portalLoginEnabled', 'portalUsername', 'notes', 'status'];
      for (const f of fields) { if (dto[f] !== undefined) updateData[f] = dto[f]; }
      const numFields = ['totalEmployees', 'employeesAbove40', 'screenedCount', 'pendingCount',
        'perEmployeeRate', 'abnormalPct'];
      for (const f of numFields) { if (dto[f] !== undefined) updateData[f] = Number(dto[f]); }
      if (dto.contractStart) updateData.contractStart = new Date(dto.contractStart);
      if (dto.contractEnd) updateData.contractEnd = new Date(dto.contractEnd);
      if (dto.complianceCertDate) updateData.complianceCertDate = new Date(dto.complianceCertDate);
      if (dto.aggregateReport) updateData.aggregateReport = dto.aggregateReport;
      if (dto.topRisks) updateData.topRisks = dto.topRisks;
      // Auto-calc utilization
      if (dto.totalEmployees && dto.screenedCount) {
        updateData.utilizationPct = Math.round((Number(dto.screenedCount) / Number(dto.totalEmployees)) * 100);
      }
      return await this.prisma.employerPortal.update({ where: { id }, data: updateData });
    } catch (err) { this.logger.error('update error', err); throw err; }
  }

  async getStats(tenantId: string) {
    try {
      const [total, active, compliant] = await Promise.all([
        this.prisma.employerPortal.count({ where: { tenantId } }),
        this.prisma.employerPortal.count({ where: { tenantId, status: 'active' } }),
        this.prisma.employerPortal.count({ where: { tenantId, labourCodeCompliant: true } }),
      ]);
      return { total, activeEmployers: active, labourCodeCompliant: compliant };
    } catch (err) { this.logger.error('getStats error', err); return { total: 0, activeEmployers: 0, labourCodeCompliant: 0 }; }
  }
}
