import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get all dashboard KPIs in one call' })
  async getDashboard(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getDashboardKPIs(tenantId);
  }

  @Get('revenue/trend')
  @ApiOperation({ summary: 'Daily revenue trend for chart' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async getRevenueTrend(@CurrentTenant() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.getRevenueTrend(tenantId, days ? parseInt(days) : 30);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Appointment analytics - completion rate, type/dept breakdown' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async getAppointmentAnalytics(@CurrentTenant() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.getAppointmentAnalytics(tenantId, days ? parseInt(days) : 30);
  }

  @Get('doctors/top')
  @ApiOperation({ summary: 'Top doctors by patient volume and revenue' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getTopDoctors(@CurrentTenant() tenantId: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTopDoctors(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get('patients/demographics')
  @ApiOperation({ summary: 'Patient demographics - gender, age, city breakdown' })
  async getPatientDemographics(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getPatientDemographics(tenantId);
  }

  @Get('whatsapp')
  @ApiOperation({ summary: 'WhatsApp engagement analytics' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  async getWhatsAppAnalytics(@CurrentTenant() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.getWhatsAppAnalytics(tenantId, days ? parseInt(days) : 30);
  }
}

  @Get('notifications')
  @ApiOperation({ summary: 'Get actionable notifications for the portal header' })
  async getNotifications(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getNotifications(tenantId);
  }
