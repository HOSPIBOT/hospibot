import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { CreatePatientDto, UpdatePatientDto, ListPatientsDto, AddTagsDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreatePatientDto) {
    return this.patientService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List patients with search, filters, and pagination' })
  async list(@CurrentTenant() tenantId: string, @Query() query: ListPatientsDto) {
    return this.patientService.list(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get patient statistics for dashboard' })
  async getStats(@CurrentTenant() tenantId: string) {
    return this.patientService.getStats(tenantId);
  }

  @Get('lookup/phone/:phone')
  @ApiOperation({ summary: 'Lookup patient by phone number (Health Vault)' })
  @ApiParam({ name: 'phone', example: '+919876543210' })
  async findByPhone(@Param('phone') phone: string) {
    return this.patientService.findByPhone(phone);
  }

  @Get('lookup/healthid/:healthId')
  @ApiOperation({ summary: 'Lookup patient by HospiBot Health ID' })
  @ApiParam({ name: 'healthId', example: 'HB-A3K7M2P9' })
  async findByHealthId(@Param('healthId') healthId: string) {
    return this.patientService.findByHealthId(healthId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID with full 360 view' })
  async findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.patientService.findById(tenantId, id);
  }

  @Patch(':id')
  @Put(':id')
  @ApiOperation({ summary: 'Update patient details' })
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(tenantId, id, dto);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to patient' })
  async addTags(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: AddTagsDto) {
    return this.patientService.addTags(tenantId, id, dto.tags);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove a tag from patient' })
  async removeTag(@CurrentTenant() tenantId: string, @Param('id') id: string, @Param('tag') tag: string) {
    return this.patientService.removeTag(tenantId, id, tag);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('TENANT_ADMIN', 'BRANCH_ADMIN')
  @ApiOperation({ summary: 'Archive a patient (soft delete)' })
  async delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.patientService.delete(tenantId, id);
  }
}
