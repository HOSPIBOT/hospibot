import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SendNotificationDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Your appointment is confirmed.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: ['whatsapp', 'sms', 'email'] })
  @IsOptional()
  @IsString()
  channel?: 'whatsapp' | 'sms' | 'email';
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification via WhatsApp/SMS/Email' })
  async send(@CurrentTenant() tenantId: string, @Body() dto: SendNotificationDto) {
    return this.notificationService.send({
      tenantId,
      phone: dto.phone,
      message: dto.message,
      channel: dto.channel || 'whatsapp',
    });
  }
}

  @Post('send-email')
  @ApiOperation({ summary: 'Send an email notification via SMTP' })
  async sendEmail(
    @CurrentTenant() tenantId: string,
    @Body() dto: { email: string; subject: string; message: string; html?: string },
  ) {
    return this.notificationService.send({
      tenantId,
      phone: '',
      email: dto.email,
      message: dto.message,
      subject: dto.subject,
      html: dto.html,
      channel: 'email',
    });
  }

  @Post('send-sms')
  @ApiOperation({ summary: 'Send an SMS via MSG91 (India)' })
  async sendSMS(
    @CurrentTenant() tenantId: string,
    @Body() dto: { phone: string; message: string },
  ) {
    return this.notificationService.send({
      tenantId,
      phone: dto.phone,
      message: dto.message,
      channel: 'sms',
    });
  }
