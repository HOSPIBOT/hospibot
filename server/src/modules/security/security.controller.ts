// security.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';

@ApiTags('Security & Compliance')
@Controller('security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(private securityService: SecurityService) {}

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs for this tenant' })
  getAuditLogs(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.securityService.getAuditLogs(tenantId, query);
  }

  // ── User Management ────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users in this tenant' })
  listUsers(@CurrentTenant() tenantId: string) {
    return this.securityService.listUsers(tenantId);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role and permissions' })
  updateUserRole(
    @CurrentTenant() tenantId: string,
    @Param('id') userId: string,
    @Body() dto: { role: string; customPermissions?: string[] },
  ) {
    return this.securityService.updateUserRole(tenantId, userId, dto);
  }

  @Put('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivateUser(@CurrentTenant() tenantId: string, @Param('id') userId: string) {
    return this.securityService.deactivateUser(tenantId, userId);
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions and roles' })
  getPermissions() {
    return {
      permissions: this.securityService.getAllPermissions(),
      roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF', 'MARKETING_USER', 'LAB_TECHNICIAN', 'PHARMACIST', 'NURSE'],
    };
  }

  @Get('permissions/roles/:role')
  @ApiOperation({ summary: 'Get default permissions for a role' })
  getRolePermissions(@Param('role') role: string) {
    return { role, permissions: this.securityService.getRolePermissions(role) };
  }

  // ── Security Stats ─────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Security overview statistics' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.securityService.getSecurityStats(tenantId);
  }

  // ── Data Export (DPDPA compliance) ─────────────────────────────────────────

  @Get('export/patient/:patientId')
  @ApiOperation({ summary: 'Export all data for a patient (DPDPA Right to Portability)' })
  exportPatientData(@CurrentTenant() tenantId: string, @Param('patientId') patientId: string) {
    return this.securityService.exportPatientData(tenantId, patientId);
  }

  @Post('erasure/patient/:patientId')
  @ApiOperation({ summary: 'Request data erasure for a patient (DPDPA Right to Erasure)' })
  requestErasure(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
  ) {
    return this.securityService.requestErasure(tenantId, patientId, user.id);
  }
}
