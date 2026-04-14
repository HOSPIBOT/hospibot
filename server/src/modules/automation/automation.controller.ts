import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { CreateRuleDto, UpdateRuleDto, ListRulesDto } from './dto/automation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Automation / Revenue Engine')
@Controller('automation')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Post('rules')
  @UseGuards(RolesGuard)
  @Roles('TENANT_ADMIN', 'BRANCH_ADMIN', 'MARKETING_USER')
  @ApiOperation({ summary: 'Create an automation rule' })
  async createRule(@CurrentTenant() tenantId: string, @Body() dto: CreateRuleDto) {
    return this.automationService.createRule(tenantId, dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List automation rules' })
  async listRules(@CurrentTenant() tenantId: string, @Query() query: ListRulesDto) {
    return this.automationService.list(tenantId, query);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get rule details with execution logs' })
  async getRule(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.automationService.findById(tenantId, id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update an automation rule' })
  async updateRule(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.automationService.updateRule(tenantId, id, dto);
  }

  @Post('rules/:id/toggle')
  @ApiOperation({ summary: 'Toggle rule active/inactive' })
  async toggleRule(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.automationService.toggleRule(tenantId, id);
  }

  @Post('execute')
  @UseGuards(RolesGuard)
  @Roles('TENANT_ADMIN')
  @ApiOperation({ summary: 'Manually trigger all active rules for this tenant' })
  async executeAll(@CurrentTenant() tenantId: string) {
    return this.automationService.processRules(tenantId);
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get pre-built protocol templates (diabetes, hypertension, etc.)' })
  async getProtocols() {
    return this.automationService.getProtocolTemplates();
  }

  @Post('protocols/:protocolId/install')
  @UseGuards(RolesGuard)
  @Roles('TENANT_ADMIN', 'BRANCH_ADMIN')
  @ApiOperation({ summary: 'Install a pre-built protocol (creates rules automatically)' })
  async installProtocol(@CurrentTenant() tenantId: string, @Param('protocolId') protocolId: string) {
    return this.automationService.installProtocol(tenantId, protocolId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Revenue engine statistics' })
  async getStats(@CurrentTenant() tenantId: string) {
    return this.automationService.getStats(tenantId);
  }

@Get('logs')
  @ApiOperation({ summary: 'Get automation activity logs' })
  getLogs(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit = 50,
  ) {
    return this.automationService.getLogs(tenantId, +limit);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an automation rule' })
  deleteRule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.deleteRule(tenantId, id);
  }
}