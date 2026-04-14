import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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

@Post(':id/feedback')
  @ApiOperation({ summary: 'Submit patient feedback and rating for a visit' })
  async submitFeedback(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { rating: number; feedback?: string; npsScore?: number },
  ) {
    return this.visitService['prisma'].visit.update({
      where: { id },
      data: {
        rating: body.rating,
        feedback: body.feedback,
        npsScore: body.npsScore,
      },
    });
  }

  @Get()
  listAll(@CurrentTenant() tenantId: string) {
    return this.visitService['prisma'].visit.findMany({
      where: { tenantId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        // doctor removed - not in VisitInclude
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update visit clinical notes, vitals, diagnosis' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.visitService['prisma'].visit.update({
      where: { id },
      data: {
        vitals:         dto.vitals,
        chiefComplaint: dto.chiefComplaint,
        diagnosisText:  dto.diagnosisText,
        diagnosisCodes: dto.diagnosisCodes,
        clinicalNotes:  dto.clinicalNotes,
        treatmentPlan:  dto.treatmentPlan,
        followUpDays:   dto.followUpDays ? Number(dto.followUpDays) : undefined,
        visitType:      dto.visitType,
      },
    });
  }
}
