import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VisitService } from './visit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Visits')
@Controller('visits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VisitController {
  constructor(private visitService: VisitService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.visitService.create(tenantId, dto);
  }

  @Get('patient/:patientId')
  listByPatient(@CurrentTenant() tenantId: string, @Param('patientId') patientId: string) {
    return this.visitService.listByPatient(tenantId, patientId);
  }

  @Get('appointment/:appointmentId')
  getByAppointment(@CurrentTenant() tenantId: string, @Param('appointmentId') appointmentId: string) {
    return this.visitService.getByAppointment(tenantId, appointmentId);
  }

  @Get(':id')
  getById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.visitService.getById(tenantId, id);
  }
}
