import { IsString, IsOptional, IsEnum, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Your appointment is confirmed for tomorrow at 10 AM.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Media URL (PDF, image)' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: ['image', 'document', 'audio', 'video'] })
  @IsOptional()
  @IsString()
  mediaType?: string;
}

export class SendTemplateDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'appointment_reminder' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: [{ type: 'body', parameters: [{ type: 'text', text: 'Dr. Ananya' }] }] })
  @IsOptional()
  @IsArray()
  components?: any[];
}

export class AssignConversationDto {
  @ApiProperty({ description: 'User ID to assign the conversation to' })
  @IsString()
  @IsNotEmpty()
  assignTo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;
}
