import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Appointment')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}
}
