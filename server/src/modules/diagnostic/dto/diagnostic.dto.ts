import {
  IsString, IsOptional, IsEnum, IsInt, IsArray, IsNotEmpty,
  IsBoolean, IsNumber, ValidateNested, IsDateString, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// ── Order DTOs ────────────────────────────────────────────────────────────────

export class OrderTestItemDto {
  @IsString() @IsNotEmpty() testId?: string;
  @IsString() @IsNotEmpty() testCode: string;
  @IsString() @IsNotEmpty() testName: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isStat?: boolean;
  @IsOptional() @IsBoolean() isOutsourced?: boolean;
  @IsOptional() @IsString() outsourcedTo?: string;
}

export class CreateOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referringDoctor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referringDoctorCrmId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() corporateClientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicalInfo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isStat?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() collectionMode?: string;

  @ApiProperty({ type: [OrderTestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderTestItemDto)
  tests: OrderTestItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
}

export class ListOrdersDto {
  @IsOptional() @Transform(({ value }) => +value) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Transform(({ value }) => +value) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true') statOnly?: boolean;
}

// ── Sample DTOs ───────────────────────────────────────────────────────────────

export class CollectSampleDto {
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() tubeType?: string;
  @IsOptional() @IsString() containerType?: string;
  @IsOptional() @IsBoolean() coldChainRequired?: boolean;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class DispatchSampleDto {
  @IsArray() @IsString({ each: true }) barcodes: string[];
  @IsOptional() @IsString() runnerId?: string;
  @IsOptional() @IsString() destinationBranchId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ReceiveSampleDto {
  @IsArray() @IsString({ each: true }) barcodes: string[];
  @IsOptional() @IsString() notes?: string;
}

export class RejectSampleDto {
  @IsString() @IsNotEmpty() barcode: string;
  @IsString() @IsNotEmpty() rejectionReason: string;
}

// ── Result Entry DTOs ─────────────────────────────────────────────────────────

export class ResultValueDto {
  @IsString() @IsNotEmpty() orderItemId: string;
  @IsOptional() @IsNumber() numericValue?: number;
  @IsOptional() @IsString() textValue?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() interpretation?: string;
  @IsOptional() @IsBoolean() isDraft?: boolean;
}

export class SubmitResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultValueDto)
  results: ResultValueDto[];

  @IsOptional() @IsBoolean() isDraft?: boolean;
}

export class ValidateResultDto {
  @IsString() @IsNotEmpty() resultEntryId: string;
  @IsOptional() @IsString() interpretation?: string;
}

export class SignReportDto {
  @IsOptional() @IsString() interpretation?: string;
  @IsOptional() @IsString() otpCode?: string;
}

export class AmendReportDto {
  @IsString() @IsNotEmpty() reason: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultValueDto)
  results: ResultValueDto[];
}

// ── Home Collection DTOs ──────────────────────────────────────────────────────

export class CreateHomeCollectionDto {
  @IsString() @IsNotEmpty() patientId: string;
  @IsDateString() scheduledDate: string;
  @IsString() @IsNotEmpty() slotTime: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() pincode: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsBoolean() coldChainRequired?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() labOrderId?: string;
}

export class AssignAgentDto {
  @IsString() @IsNotEmpty() agentId: string;
  @IsOptional() @IsString() notes?: string;
}

export class AgentCheckinDto {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsOptional() @IsString() notes?: string;
}

export class CollectionCheckoutDto {
  @IsArray() @IsString({ each: true }) barcodes: string[];
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

// ── Catalog DTOs ──────────────────────────────────────────────────────────────

export class ReferenceRangeDto {
  @IsOptional() @IsNumber() ageMinYears?: number;
  @IsOptional() @IsNumber() ageMaxYears?: number;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsNumber() lowerNormal?: number;
  @IsOptional() @IsNumber() upperNormal?: number;
  @IsOptional() @IsNumber() lowerCritical?: number;
  @IsOptional() @IsNumber() upperCritical?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() interpretation?: string;
}

export class CreateTestDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() category: string;
  @IsInt() @Min(0) price: number;
  @IsOptional() @IsInt() turnaroundHrs?: number;
  @IsOptional() @IsString() sampleType?: string;
  @IsOptional() @IsString() containerType?: string;
  @IsOptional() @IsString() fastingRequired?: string;
  @IsOptional() @IsString() methodology?: string;
  @IsOptional() @IsBoolean() isHomeCollectionAllowed?: boolean;
  @IsOptional() @IsBoolean() isOutsourced?: boolean;
  @IsOptional() @IsString() outsourcedTo?: string;
  @IsOptional() @IsBoolean() isCdscoRegulated?: boolean;
  @IsOptional() @IsString() nablCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceRangeDto)
  referenceRanges?: ReferenceRangeDto[];
}

export class CreatePackageDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) price: number;
  @IsArray() @IsString({ each: true }) testCodes: string[];
  @IsOptional() @IsString() packageType?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Doctor CRM DTOs ───────────────────────────────────────────────────────────

export class CreateDoctorCRMDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() mobile: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() clinicName?: string;
  @IsOptional() @IsString() clinicAddress?: string;
  @IsOptional() @IsString() mciNumber?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsInt() incentiveRate?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateCorporateClientDto {
  @IsString() @IsNotEmpty() companyName: string;
  @IsString() @IsNotEmpty() hrContactMobile: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @IsString() hrContactName?: string;
  @IsOptional() @IsString() hrContactEmail?: string;
  @IsOptional() @IsInt() creditLimit?: number;
  @IsOptional() @IsInt() creditDays?: number;
  @IsOptional() @IsDateString() contractExpiry?: string;
}

// ── QC DTOs ───────────────────────────────────────────────────────────────────

export class CreateQcResultDto {
  @IsString() @IsNotEmpty() testCode: string;
  @IsOptional() @IsString() analyserId?: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsString() @IsNotEmpty() controlLevel: string;
  @IsNumber() expectedValue: number;
  @IsNumber() actualValue: number;
  @IsOptional() @IsNumber() mean?: number;
  @IsOptional() @IsNumber() sd?: number;
  @IsDateString() runDate: string;
}

// ── Reagent / Inventory DTOs ──────────────────────────────────────────────────

export class CreateReagentDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() manufacturer?: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() storageTemp?: string;
  @IsNumber() currentStock: number;
  @IsNumber() minStockLevel: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) linkedTestCodes?: string[];
  @IsOptional() @IsString() supplier?: string;
}

export class AdjustStockDto {
  @IsString() @IsNotEmpty() txType: string;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() notes?: string;
}

// ── Automation / Revenue Engine DTOs ─────────────────────────────────────────

export class CreateAutomationRuleDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() testCode?: string;
  @IsString() @IsNotEmpty() triggerEvent: string;
  @IsOptional() conditionJson?: any;
  @IsInt() @Min(1) waitDays: number;
  @IsString() @IsNotEmpty() templateCode: string;
  @IsOptional() @IsString() messageText?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Billing / Wallet DTOs ─────────────────────────────────────────────────────

export class CreateRechargeOrderDto {
  @IsString() @IsNotEmpty() packId: string;
  @IsOptional() @IsString() paymentMethodId?: string;
}

export class VerifyPaymentDto {
  @IsString() @IsNotEmpty() razorpayOrderId: string;
  @IsString() @IsNotEmpty() razorpayPaymentId: string;
  @IsString() @IsNotEmpty() razorpaySignature: string;
}

export class AutoRechargeConfigDto {
  @IsString() @IsNotEmpty() walletType: string;
  @IsBoolean() enabled: boolean;
  @IsOptional() @IsInt() threshold?: number;
  @IsOptional() @IsString() packId?: string;
  @IsOptional() @IsInt() monthlyCapPaise?: number;
}
