import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Patient')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientController {
  constructor(private patientService: PatientService) {}
}
