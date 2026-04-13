import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto, UpdateDoctorDto, SetScheduleDto, ListDoctorsDto } from './dto/doctor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('TENANT_ADMIN', 'BRANCH_ADMIN')
  @ApiOperation({ summary: 'Create a doctor profile' })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateDoctorDto) {
    return this.doctorService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List doctors with filters' })
  async list(@CurrentTenant() tenantId: string, @Query() query: ListDoctorsDto) {
    return this.doctorService.list(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  async findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.doctorService.findById(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update doctor profile' })
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.update(tenantId, id, dto);
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Set doctor weekly schedule' })
  async setSchedule(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: SetScheduleDto) {
    return this.doctorService.setSchedule(tenantId, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch doctor profile' })
  async patch(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: any) {
    return this.doctorService.update(tenantId, id, dto);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available appointment slots for a date' })
  @ApiQuery({ name: 'date', example: '2026-04-15' })
  async getSlots(@CurrentTenant() tenantId: string, @Param('id') id: string, @Query('date') date: string) {
    return this.doctorService.getAvailableSlots(tenantId, id, date);
  }
  // ── Department endpoints ───────────────────────────────────────────────────

  @Get('/departments')
  @ApiOperation({ summary: 'List all departments' })
  listDepartments(@CurrentTenant() tenantId: string, @Query('limit') limit?: string) {
    return this.doctorService.listDepartments(tenantId, limit ? +limit : 100);
  }

  @Post('/departments')
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(@CurrentTenant() tenantId: string, @Body() dto: { name: string; code?: string; type?: string }) {
    return this.doctorService.createDepartment(tenantId, dto);
  }

  @Delete('/departments/:id')
  @ApiOperation({ summary: 'Delete (deactivate) a department' })
  deleteDepartment(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.doctorService.deleteDepartment(tenantId, id);
  }
}
