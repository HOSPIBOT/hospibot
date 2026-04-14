import {
  IsString, IsOptional, IsEnum, IsInt, IsArray, IsNotEmpty, IsDateString, Min, Max,
  ValidateNested, IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class InvoiceItemDto {
  @ApiProperty({ example: 'Consultation - Dr. Ananya Rao' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 80000, description: 'Rate in paise (₹800 = 80000)' })
  @IsInt()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ example: 18, description: 'GST percentage' })
  @IsOptional()
  @IsNumber()
  gstRate?: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitId?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Discount in paise' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: '2026-05-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ example: 80000, description: 'Amount in paise' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ type: String })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Razorpay order ID' })
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;

  @ApiPropertyOptional({ description: 'Razorpay payment ID' })
  @IsOptional()
  @IsString()
  gatewayPaymentId?: string;

  @ApiPropertyOptional({ description: 'Razorpay signature' })
  @IsOptional()
  @IsString()
  gatewaySignature?: string;
}

export class ListInvoicesDto {
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
  patientId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'From date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
