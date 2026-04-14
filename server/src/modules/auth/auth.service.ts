import {
  Injectable, UnauthorizedException, ConflictException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterTenantDto, LoginDto, CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── Registration ───────────────────────────────────────────────────────────

  async registerTenant(dto: RegisterTenantDto) {
    const [existingTenant, existingUser] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug: dto.slug } }),
      this.prisma.user.findFirst({ where: { email: dto.adminEmail } }),
    ]);
    if (existingTenant) throw new ConflictException('Organization slug already taken');
    if (existingUser)  throw new ConflictException('Email already registered');

    // Resolve portal family & sub-type IDs from slugs
    let portalFamilyId: string | undefined;
    let subTypeId: string | undefined;
    let subTypeFeatureFlags: Record<string, boolean> = {};

    if (dto.portalFamily) {
      const family = await this.prisma.portalFamily.findUnique({
        where: { slug: dto.portalFamily },
      });
      if (family) {
        portalFamilyId = family.id;

        if (dto.subTypeSlug) {
          const subType = await this.prisma.tenantSubType.findUnique({
            where: { portalFamilyId_slug: { portalFamilyId: family.id, slug: dto.subTypeSlug } },
          });
          if (subType) {
            subTypeId = subType.id;
            subTypeFeatureFlags = subType.featureFlags as Record<string, boolean>;
          }
        }
      }
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: (dto.type || 'CLINIC') as any,
          email: dto.adminEmail,
          phone: dto.phone,
          website: dto.website,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          country: dto.country || 'India',
          pincode: dto.pincode,
          gstNumber: dto.gstNumber,
          plan: (dto.plan || 'STARTER') as any,
          portalFamilyId: portalFamilyId ?? null,
          subTypeId: subTypeId ?? null,
          // Store extra registration details (drug licence, NABL etc.) in settings
          settings: dto.registrationDetails
            ? { registrationDetails: dto.registrationDetails }
            : {},
        },
        include: {
          portalFamily: { select: { id: true, name: true, slug: true } },
          subType:      { select: { id: true, name: true, slug: true, featureFlags: true } },
        },
      });

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

    const tokens = await this.generateTokens(
      result.user.id, result.tenant.id, result.user.role,
    );

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        type: result.tenant.type,
        plan: result.tenant.plan,
        portalFamily: result.tenant.portalFamily,
        subType: result.tenant.subType,
        featureFlags: subTypeFeatureFlags,
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

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: {
        tenant: {
          select: {
            id: true, name: true, slug: true, type: true, status: true, plan: true, logoUrl: true,
            portalFamily: { select: { id: true, name: true, slug: true } },
            subType: {
              select: { id: true, name: true, slug: true, featureFlags: true },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (user.role !== 'SUPER_ADMIN' && user.tenant) {
      if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CANCELLED') {
        throw new UnauthorizedException('Your account is inactive. Contact support@hospibot.in');
      }
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
      tenant: {
        ...user.tenant,
        featureFlags: (user.tenant.subType?.featureFlags ?? {}) as Record<string, boolean>,
      },
      ...tokens,
    };
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true },
      });
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      return this.generateTokens(user.id, user.tenantId, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ── Create user (tenant admin action) ─────────────────────────────────────

  async createUser(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered in this organization');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        tenantId, branchId: dto.branchId, email: dto.email, phone: dto.phone,
        passwordHash, firstName: dto.firstName, lastName: dto.lastName, role: dto.role as any,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, branchId: true, createdAt: true,
      },
    });
  }

  // ── Get profile ───────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, avatarUrl: true, branchId: true, lastLoginAt: true,
        tenant: {
          select: {
            id: true, name: true, slug: true, type: true, status: true, plan: true, logoUrl: true,
            portalFamily: { select: { id: true, name: true, slug: true } },
            subType: { select: { id: true, name: true, slug: true, featureFlags: true } },
          },
        },
        branch: { select: { id: true, name: true, city: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Token generation ──────────────────────────────────────────────────────

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
