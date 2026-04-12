import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Doctor')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DoctorController {
  constructor(private doctorService: DoctorService) {}
}
