import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Universal Health Vault')
@Controller('vault')
export class VaultController {
  constructor(private vaultService: VaultService) {}

  // ── Lookup patient by phone ────────────────────────────────────────────────

  @Get('lookup')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Look up a patient\'s Universal Health Record by mobile number' })
  lookup(
    @CurrentTenant() tenantId: string,
    @Query('phone') phone: string,
  ) {
    return this.vaultService.lookupByPhone(phone, tenantId);
  }

  // ── Request consent ────────────────────────────────────────────────────────

  @Post('request-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request patient consent to access their health records' })
  requestAccess(
    @CurrentTenant() tenantId: string,
    @Body() body: { mobileNumber: string; tenantName: string; staffName?: string },
  ) {
    return this.vaultService.requestAccess({
      requestingTenantId: tenantId,
      requestingTenantName: body.tenantName,
      mobileNumber: body.mobileNumber,
      staffName: body.staffName,
    });
  }

  // ── Get records for a patient (with consent check) ─────────────────────────

  @Get('records/:uhrId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get health records for a patient (respects consent scope)' })
  getRecords(
    @CurrentTenant() tenantId: string,
    @Param('uhrId') uhrId: string,
  ) {
    return this.vaultService.getRecordsForTenant({ uhrId, requestingTenantId: tenantId });
  }

  // ── Emergency access ───────────────────────────────────────────────────────

  @Post('emergency-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emergency access — returns critical data only, fully audited' })
  emergencyAccess(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() body: { mobileNumber: string; reason: string },
  ) {
    return this.vaultService.emergencyAccess({
      mobileNumber: body.mobileNumber,
      requestingTenantId: tenantId,
      staffId: user?.id || 'unknown',
      reason: body.reason,
    });
  }

  // ── Add dependent ──────────────────────────────────────────────────────────

  @Post('dependents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a family member as a dependent' })
  addDependent(
    @Body() body: {
      primaryMobile: string;
      dependentMobile: string;
      relationship: 'CHILD' | 'PARENT' | 'SPOUSE' | 'SIBLING' | 'OTHER';
      dependentName?: string;
    },
  ) {
    return this.vaultService.addDependent(body);
  }

  // ── Handle consent response (called from WhatsApp chatbot) ────────────────

  @Post('consent-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record patient consent response (called internally by chatbot)' })
  handleConsent(
    @Body() body: { mobileNumber: string; response: string; tenantId?: string },
  ) {
    return this.vaultService.handleConsentResponse({
      mobileNumber: body.mobileNumber,
      response: body.response as any,
      tenantId: body.tenantId,
    });
  }

  // ── Vault stats for tenant ─────────────────────────────────────────────────

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Health Vault statistics for this tenant' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.vaultService.getVaultStats(tenantId);
  }

  // ── Link patient to vault (called during patient registration) ─────────────

  @Post('link-patient')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link an existing patient record to Universal Health Vault' })
  linkPatient(
    @CurrentTenant() tenantId: string,
    @Body() body: { patientId: string },
  ) {
    return this.vaultService.linkPatientToVault(tenantId, body.patientId);
  }
}
