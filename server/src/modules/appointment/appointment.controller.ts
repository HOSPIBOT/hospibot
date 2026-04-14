import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto, UpdateAppointmentStatusDto, RescheduleDto, ListAppointmentsDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Book a new appointment' })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments with filters' })
  async list(@CurrentTenant() tenantId: string, @Query() query: ListAppointmentsDto) {
    return this.appointmentService.list(tenantId, query);
  }

  @Get('today/stats')
  @ApiOperation({ summary: 'Get today appointment statistics' })
  async todayStats(@CurrentTenant() tenantId: string) {
    return this.appointmentService.getTodayStats(tenantId);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get live patient queue' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  async getQueue(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentService.getQueue(tenantId, { branchId, doctorId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details' })
  async findById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.appointmentService.findById(tenantId, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update appointment status (confirm, check-in, complete, cancel)' })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateStatus(tenantId, id, dto);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  async reschedule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.appointmentService.reschedule(tenantId, id, dto);
  }
  @Patch(':id/status')
  @ApiOperation({ summary: 'PATCH alias for status update' })
  async patchStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.appointmentService.updateStatus(tenantId, id, { status } as any);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update appointment fields' })
  async patch(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.appointmentService.update(tenantId, id, dto);
  }
}
