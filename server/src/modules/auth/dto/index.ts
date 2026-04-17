import {
  IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'City Multi-Specialty Hospital' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'city-hospital-hyd' })
  @IsString() @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers and hyphens only' })
  slug: string;

  @ApiPropertyOptional({ example: 'HOSPITAL', description: 'Legacy type field — kept for backward compat' })
  @IsOptional() @IsString()
  type?: string;

  // ── New portal system fields ────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'clinical', description: 'Portal family slug (clinical, diagnostic, pharmacy…)' })
  @IsOptional() @IsString()
  portalFamily?: string;

  @ApiPropertyOptional({ example: 'multi-specialty-clinic' })
  @IsOptional() @IsString()
  subTypeSlug?: string;

  // ── Diagnostic-specific tier selection ──────────────────────────────────────
  @ApiPropertyOptional({ example: 'medium', enum: ['small', 'medium', 'large', 'enterprise'] })
  @IsOptional() @IsString()
  labTier?: string;

  // ── Diagnostic tier-specific org details (Medium+) ──────────────────────────
  @ApiPropertyOptional({ description: 'NABL accreditation certificate number' })
  @IsOptional() @IsString()
  nablNumber?: string;

  @ApiPropertyOptional({ description: 'Number of sample collection points' })
  @IsOptional() @IsString()
  collectionPoints?: string;

  // ── Diagnostic tier-specific org details (Large+) ───────────────────────────
  @ApiPropertyOptional({ description: 'Total branch count' })
  @IsOptional() @IsString()
  branchCount?: string;

  @ApiPropertyOptional({ description: 'Analyser brands in use (Sysmex, Beckman, etc.)' })
  @IsOptional() @IsString()
  analyserBrands?: string;

  // ── Diagnostic tier-specific org details (Enterprise) ───────────────────────
  @ApiPropertyOptional({ description: 'Lab chain / group name' })
  @IsOptional() @IsString()
  groupName?: string;

  @ApiPropertyOptional({ example: 'no', enum: ['no', 'yes', 'hybrid'] })
  @IsOptional() @IsString()
  isFranchise?: string;

  @ApiPropertyOptional({ description: 'Existing software they may be migrating from' })
  @IsOptional() @IsString()
  existingSoftware?: string;

  @ApiPropertyOptional({ description: 'Estimated monthly test volume' })
  @IsOptional() @IsString()
  monthlyVolume?: string;

  @ApiPropertyOptional({ description: 'Extra registration details: GST, drug licence, NABL etc.' })
  @IsOptional()
  registrationDetails?: Record<string, string>;

  // ── Contact ─────────────────────────────────────────────────────────────────
  @ApiProperty({ example: '+919876543210' })
  @IsString() @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstNumber?: string;

  // ── Admin user ──────────────────────────────────────────────────────────────
  @ApiProperty({ example: 'admin@cityhospital.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString() @MinLength(8)
  adminPassword: string;

  @ApiProperty({ example: 'Vinod' })
  @IsString() @IsNotEmpty()
  adminFirstName: string;

  @ApiPropertyOptional({ example: 'Bysani' })
  @IsOptional() @IsString()
  adminLastName?: string;

  // ── Subscription ────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'GROWTH', enum: ['STARTER', 'GROWTH', 'ENTERPRISE'] })
  @IsOptional() @IsString()
  plan?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@cityhospital.com' }) @IsEmail() email: string;
  @ApiProperty({ example: 'SecurePass123!' }) @IsString() @IsNotEmpty() password: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() @IsNotEmpty() refreshToken: string;
}

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty() @IsString() @IsNotEmpty() firstName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() @IsNotEmpty() role: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
}
