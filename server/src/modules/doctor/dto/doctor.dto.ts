import {
  IsString, IsOptional, IsArray, IsInt, IsBoolean, IsNotEmpty, IsEnum, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDoctorDto {
  @ApiProperty({ description: 'User ID of the doctor (must exist)' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'KMC-12345' })
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ example: ['Cardiology', 'Internal Medicine'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'MBBS, MD - Cardiology' })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  experience?: number;

  @ApiPropertyOptional({ example: 80000, description: 'Fee in paise (800 INR = 80000 paise)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 15, description: 'Slot duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class SetScheduleDto {
  @ApiProperty({
    description: 'Weekly schedule',
    example: {
      monday: { start: '09:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: null,
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '15:00' },
      saturday: { start: '10:00', end: '13:00' },
      sunday: null,
    },
  })
  schedule: Record<string, { start: string; end: string; breakStart?: string; breakEnd?: string } | null>;
}

export class ListDoctorsDto {
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
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  availableOnly?: boolean;
}
