import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateLeadDto, UpdateLeadDto, ListLeadsDto, CreateCampaignDto, ListCampaignsDto } from './dto/crm.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('CRM')
@Controller('crm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private crmService: CrmService) {}

  // ===== LEADS =====

  @Post('leads')
  @ApiOperation({ summary: 'Create a new lead' })
  async createLead(@CurrentTenant() tenantId: string, @Body() dto: CreateLeadDto) {
    return this.crmService.createLead(tenantId, dto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'List leads with pipeline filters' })
  async listLeads(@CurrentTenant() tenantId: string, @Query() query: ListLeadsDto) {
    return this.crmService.list(tenantId, query);
  }

  @Get('leads/funnel')
  @ApiOperation({ summary: 'Get lead funnel statistics and source breakdown' })
  async getFunnel(@CurrentTenant() tenantId: string) {
    return this.crmService.getFunnelStats(tenantId);
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead details' })
  async getLead(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crmService.findById(tenantId, id);
  }

  @Put('leads/:id')
  @ApiOperation({ summary: 'Update lead stage, assignment, tags' })
  async updateLead(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.crmService.updateLead(tenantId, id, dto);
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convert lead to patient record' })
  async convertLead(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crmService.convertToPatient(tenantId, id);
  }

  // ===== CAMPAIGNS =====

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a WhatsApp broadcast campaign with patient filters' })
  async createCampaign(@CurrentTenant() tenantId: string, @Body() dto: CreateCampaignDto) {
    return this.crmService.createCampaign(tenantId, dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  async listCampaigns(@CurrentTenant() tenantId: string, @Query() query: ListCampaignsDto) {
    return this.crmService.listCampaigns(tenantId, query);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details with stats' })
  async getCampaign(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crmService.getCampaignById(tenantId, id);
  }

  @Post('campaigns/:id/execute')
  @ApiOperation({ summary: 'Execute campaign - send messages to matched patients' })
  async executeCampaign(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crmService.executeCampaign(tenantId, id);
  }
}
