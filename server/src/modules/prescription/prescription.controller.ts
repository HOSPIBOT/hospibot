// prescription.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionController {
  constructor(private prescriptionService: PrescriptionService) {}

  @Get('metadata')
  @ApiOperation({ summary: 'Drug picker metadata — common drugs, frequencies, durations' })
  getMetadata() { return this.prescriptionService.getMetadata(); }

  @Get()
  @ApiOperation({ summary: 'List all prescriptions with filters' })
  listAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.prescriptionService.listAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.prescriptionService.create(tenantId, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get prescriptions for a patient' })
  listByPatient(@CurrentTenant() tenantId: string, @Param('patientId') patientId: string) {
    return this.prescriptionService.listByPatient(tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single prescription' })
  getById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.prescriptionService.getById(tenantId, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send prescription to patient via WhatsApp' })
  sendViaWhatsApp(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.prescriptionService.sendViaWhatsApp(tenantId, id);
  }

  @Post(':id/refill')
  @ApiOperation({ summary: 'Create refill — duplicates active prescription with new refillDueDate' })
  async createRefill(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { daysSupply?: number },
  ) {
    const rx = await this.prescriptionService['prisma'].prescription.findFirst({
      where: { id, tenantId },
    });
    if (!rx) throw new Error('Prescription not found');
    const daysSupply = dto.daysSupply || 30;
    const refillDueDate = new Date(Date.now() + daysSupply * 24 * 60 * 60 * 1000);
    return this.prescriptionService['prisma'].prescription.create({
      data: {
        tenantId: rx.tenantId,
        patientId: rx.patientId,
        doctorId: rx.doctorId,
        medications: rx.medications as any,
        // instructions removed (not in Prescription schema)
        refillDueDate,
        isActive: true,
        // originalPrescriptionId removed - not in Prisma schema
      },
    });
  }

}