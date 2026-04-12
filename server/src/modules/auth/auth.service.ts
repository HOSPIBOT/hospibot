import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Register a new tenant (hospital/clinic/doctor) with admin user
   */
  async registerTenant(dto: RegisterTenantDto) {
    // Check if tenant slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingTenant) {
      throw new ConflictException('Organization slug already taken');
    }

    // Check if admin email already exists globally
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    // Create tenant + admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          email: dto.adminEmail,
          phone: dto.phone,
          city: dto.city,
          state: dto.state,
          country: dto.country || 'India',
        },
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: `${dto.name} - Main`,
          code: 'MAIN',
          city: dto.city,
          state: dto.state,
          country: dto.country || 'India',
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          email: dto.adminEmail,
          phone: dto.phone,
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: 'TENANT_ADMIN',
        },
      });

      return { tenant, branch, user };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.tenant.id, result.user.role);

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        type: result.tenant.type,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      ...tokens,
    };
  }

  /**
   * Login with email + password
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check tenant status
    if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CANCELLED') {
      throw new UnauthorizedException('Your organization account is inactive. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.tenantId, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
      },
      tenant: user.tenant,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.tenantId, user.role);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Create a new user within a tenant (admin action)
   */
  async createUser(tenantId: string, dto: CreateUserDto) {
    // Check if email exists in this tenant
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered in this organization');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        branchId: true,
        lastLoginAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
            plan: true,
            logoUrl: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Generate access + refresh token pair
   */
  private async generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
