import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsNotEmpty, IsObject, IsArray, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutomationTrigger } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateRuleDto {
  @ApiProperty({ example: 'Diabetic Follow-Up (90 days)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Remind diabetic patients for HbA1c test every 90 days' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AutomationTrigger })
  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @ApiProperty({
    example: { diagnosisCodes: ['E11'], tags: ['diabetic'] },
    description: 'Conditions that must match for the rule to fire',
  })
  @IsObject()
  conditions: Record<string, any>;

  @ApiProperty({ example: 90, description: 'Wait days before firing action' })
  @IsInt()
  @Min(1)
  waitDays: number;

  @ApiProperty({
    example: [
      { type: 'SEND_WHATSAPP', message: 'Hi {{name}}, it is time for your HbA1c test. Reply BOOK to schedule.' },
    ],
  })
  @IsArray()
  actions: any[];

  @ApiPropertyOptional({
    example: { retryAfterDays: 7, maxRetries: 2, escalateTo: 'care-coordinator' },
  })
  @IsOptional()
  @IsObject()
  escalation?: Record<string, any>;
}

export class UpdateRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  waitDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  actions?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  escalation?: Record<string, any>;
}

export class ListRulesDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;

  @ApiPropertyOptional({ enum: AutomationTrigger })
  @IsOptional()
  @IsEnum(AutomationTrigger)
  trigger?: AutomationTrigger;
}
