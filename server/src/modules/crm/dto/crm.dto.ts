import {
  IsString, IsOptional, IsEnum, IsInt, IsArray, IsNotEmpty, IsObject, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LeadStage, LeadSource } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateLeadDto {
  @ApiProperty({ example: 'Rahul Mehta' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'rahul@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: LeadSource, default: 'WHATSAPP' })
  @IsEnum(LeadSource)
  source: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ example: ['interested-dental', 'walk-in'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Assign to user ID' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: LeadStage })
  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  score?: number;
}

export class ListLeadsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LeadStage })
  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Diabetic patients - HbA1c reminder' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'hba1c_reminder', description: 'WhatsApp template name' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Patient filters for targeting',
    example: { tags: ['diabetic'], lastVisitBefore: '2026-01-01', city: 'Hyderabad' },
  })
  @IsObject()
  filters: Record<string, any>;

  @ApiPropertyOptional({ description: 'Schedule for later (ISO date)' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

export class ListCampaignsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['draft', 'scheduled', 'executing', 'completed', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;
}
