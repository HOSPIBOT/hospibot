/**
 * Compliance Controller — Sprint 3 Regulatory Surfaces
 *
 * All routes are tenant-scoped and require JWT + TenantGuard.
 * The guard methods live on the service (assert*) and are invoked internally
 * by DiagnosticService.signAndRelease, not exposed as HTTP endpoints.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private service: ComplianceService) {}

  // ── Dashboard status ─────────────────────────────────────────────────────

  @Get('status')
  @ApiOperation({ summary: 'Aggregate compliance dashboard for this tenant' })
  getStatus(@CurrentTenant() tenantId: string, @Query('branchId') branchId?: string) {
    return this.service.getComplianceStatus(tenantId, branchId);
  }

  // ── PC-PNDT Form F ───────────────────────────────────────────────────────

  @Get('pcpndt/form-f')
  @ApiOperation({ summary: 'List PC-PNDT Form F records' })
  listFormF(
    @CurrentTenant() tenantId: string,
    @Query('labOrderId') labOrderId?: string,
    @Query('submitted') submitted?: string,
  ) {
    const submittedBool = submitted === 'true' ? true : submitted === 'false' ? false : undefined;
    return this.service.listFormF(tenantId, { labOrderId, submitted: submittedBool });
  }

  @Post('pcpndt/form-f')
  @ApiOperation({ summary: 'Create PC-PNDT Form F' })
  createFormF(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createFormF(tenantId, dto);
  }

  @Patch('pcpndt/form-f/:id/submit')
  @ApiOperation({ summary: 'Mark Form F as submitted to the Appropriate Authority' })
  markFormFSubmitted(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.markFormFSubmitted(tenantId, id);
  }

  // ── AERB dose entries ────────────────────────────────────────────────────

  @Get('aerb/dose-entries')
  @ApiOperation({ summary: 'List AERB radiation dose entries' })
  listAerbDoseEntries(
    @CurrentTenant() tenantId: string,
    @Query('labOrderId') labOrderId?: string,
    @Query('operatorUserId') operatorUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listAerbDoseEntries(tenantId, { labOrderId, operatorUserId, from, to });
  }

  @Post('aerb/dose-entries')
  @ApiOperation({ summary: 'Create AERB radiation dose entry' })
  createAerbDoseEntry(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createAerbDoseEntry(tenantId, dto);
  }

  // ── Pregnancy screenings ─────────────────────────────────────────────────

  @Get('pregnancy-screenings')
  @ApiOperation({ summary: 'List pregnancy screenings (PC-PNDT sex-determination safeguard)' })
  listPregnancyScreenings(
    @CurrentTenant() tenantId: string,
    @Query('labOrderId') labOrderId?: string,
    @Query('flagged') flagged?: string,
  ) {
    const flaggedBool = flagged === 'true' ? true : flagged === 'false' ? false : undefined;
    return this.service.listPregnancyScreenings(tenantId, { labOrderId, flagged: flaggedBool });
  }

  @Post('pregnancy-screenings')
  @ApiOperation({ summary: 'Create pregnancy screening record' })
  createPregnancyScreening(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createPregnancyScreening(tenantId, dto);
  }

  @Patch('pregnancy-screenings/:id')
  @ApiOperation({ summary: 'Update pregnancy screening (consent flags, flag for review)' })
  updatePregnancyScreening(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() patch: any,
  ) {
    return this.service.updatePregnancyScreening(tenantId, id, patch);
  }

  // ── Mammography operator logs ────────────────────────────────────────────

  @Get('mammography/operator-logs')
  @ApiOperation({ summary: 'List mammography operator certification + daily QC logs' })
  listMammoOperatorLogs(
    @CurrentTenant() tenantId: string,
    @Query('operatorUserId') operatorUserId?: string,
  ) {
    return this.service.listMammoOperatorLogs(tenantId, operatorUserId);
  }

  @Post('mammography/operator-logs')
  @ApiOperation({ summary: 'Create mammography operator log (certification + daily phantom QC)' })
  createMammoOperatorLog(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createMammoOperatorLog(tenantId, dto);
  }

  // ── Bio-medical waste logs ───────────────────────────────────────────────

  @Get('bmw/waste-logs')
  @ApiOperation({ summary: 'List bio-medical waste daily logs' })
  listBmwLogs(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listBmwLogs(tenantId, { branchId, from, to });
  }

  @Post('bmw/waste-logs')
  @ApiOperation({ summary: 'Create BMW daily segregation log' })
  createBmwLog(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createBmwLog(tenantId, dto);
  }

  // ── Biosafety checklists ─────────────────────────────────────────────────

  @Get('biosafety/checklists')
  @ApiOperation({ summary: 'List biosafety (BSL-2) checklists' })
  listBiosafetyChecklists(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.listBiosafetyChecklists(tenantId, { branchId });
  }

  @Post('biosafety/checklists')
  @ApiOperation({ summary: 'Create biosafety checklist entry (auto-computes passed)' })
  createBiosafetyChecklist(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.service.createBiosafetyChecklist(tenantId, dto);
  }
}
