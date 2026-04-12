import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Whatsapp')
@Controller('whatsapps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}
}
