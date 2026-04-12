import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatusAction {
  ACTIVATE = 'ACTIVATE',
  SUSPEND = 'SUSPEND',
  CANCEL = 'CANCEL',
}

export enum PlanTypeDto {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatusAction })
  @IsEnum(TenantStatusAction)
  action: TenantStatusAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateTenantPlanDto {
  @ApiProperty({ enum: PlanTypeDto })
  @IsEnum(PlanTypeDto)
  plan: PlanTypeDto;
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ enum: ['INFO', 'WARNING', 'SUCCESS', 'MAINTENANCE'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'ALL | PLAN:STARTER | PLAN:GROWTH | PLAN:ENTERPRISE | STATUS:TRIAL | STATUS:ACTIVE | STATUS:SUSPENDED' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  scheduledAt?: Date;
}

export class PlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  trialDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  autoSuspendAfterDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  allowNewRegistrations?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  alertEmailRecipients?: string;
}
