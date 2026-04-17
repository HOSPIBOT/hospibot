import {
  Injectable, Logger, UnauthorizedException, ConflictException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterTenantDto, LoginDto, CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
      // Build settings JSON with labTier + tier-specific details
      const settingsPayload: Record<string, any> = {};
      if (dto.registrationDetails) settingsPayload.registrationDetails = dto.registrationDetails;
      if (dto.labTier) settingsPayload.labTier = dto.labTier;

      // Collect any non-empty tier-specific fields under settings.tierDetails
      const tierDetails: Record<string, string> = {};
      if (dto.nablNumber)       tierDetails.nablNumber       = dto.nablNumber;
      if (dto.collectionPoints) tierDetails.collectionPoints = dto.collectionPoints;
      if (dto.branchCount)      tierDetails.branchCount      = dto.branchCount;
      if (dto.analyserBrands)   tierDetails.analyserBrands   = dto.analyserBrands;
      if (dto.groupName)        tierDetails.groupName        = dto.groupName;
      if (dto.isFranchise)      tierDetails.isFranchise      = dto.isFranchise;
      if (dto.existingSoftware) tierDetails.existingSoftware = dto.existingSoftware;
      if (dto.monthlyVolume)    tierDetails.monthlyVolume    = dto.monthlyVolume;
      if (Object.keys(tierDetails).length > 0) settingsPayload.tierDetails = tierDetails;

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
          settings: settingsPayload,
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

    // Post-registration: auto-setup for diagnostic portal
    if (result.tenant.portalFamily?.slug === 'diagnostic') {
      this.setupDiagnosticTenant(result.tenant.id).catch(err =>
        this.logger.error(`Diagnostic setup failed for ${result.tenant.id}: ${err.message}`)
      );
    }

    // Create initial wallet for all tenants
    await (this.prisma as any).tenantWallet?.upsert({
      where: { tenantId: result.tenant.id },
      create: { tenantId: result.tenant.id, waCredits: 100 }, // 100 free credits on signup
      update: {},
    }).catch(() => {});

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
        subtypeSlug: result.tenant.subType?.slug ?? null,
        labTier: dto.labTier ?? null,
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
    // Check platform_admins table first
    const platformAdmin = await this.prisma.platformAdmin.findFirst({
      where: { email: dto.email, isActive: true },
    });

    if (platformAdmin) {
      const isValid = await bcrypt.compare(dto.password, platformAdmin.passwordHash);
      if (!isValid) throw new UnauthorizedException('Invalid email or password');
      await this.prisma.platformAdmin.update({
        where: { id: platformAdmin.id },
        data: { lastLoginAt: new Date() },
      });
      const tokens = await this.generateTokens(platformAdmin.id, null, 'SUPER_ADMIN');
      return {
        user: {
          id: platformAdmin.id,
          email: platformAdmin.email,
          firstName: platformAdmin.firstName,
          lastName: platformAdmin.lastName,
          role: 'SUPER_ADMIN',
          tenantId: null,
        },
        tenant: null,
        ...tokens,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: {
        tenant: {
          select: {
            id: true, name: true, slug: true, type: true, status: true, plan: true, logoUrl: true,
            settings: true,
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

    // Extract labTier from tenant.settings (stored at registration)
    const tenantSettings = (user.tenant?.settings ?? {}) as Record<string, any>;
    const labTier: string | null = tenantSettings.labTier ?? null;

    // Strip settings from the response (internal) but keep derived values
    const { settings: _s, ...tenantRest } = (user.tenant as any) ?? {};

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
        ...tenantRest,
        subtypeSlug: user.tenant?.subType?.slug ?? null,
        labTier,
        featureFlags: (user.tenant?.subType?.featureFlags ?? {}) as Record<string, boolean>,
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

      // SUPER_ADMIN refresh — look up platform_admins
      if (payload.role === 'SUPER_ADMIN') {
        const admin = await this.prisma.platformAdmin.findUnique({
          where: { id: payload.sub, isActive: true },
        });
        if (!admin) throw new UnauthorizedException('Invalid refresh token');
        return this.generateTokens(admin.id, null, admin.role);
      }

      // Regular tenant user refresh
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


  async listTenantUsers(tenantId: string, query: { role?: string; search?: string; page?: number; limit?: number }) {
    const { role, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenantId, isActive: true };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true, branchId: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

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

  private async generateTokens(userId: string, tenantId: string | null, role: string) {
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

  // ── Auto-setup for new diagnostic tenants ─────────────────────────────────

  private async setupDiagnosticTenant(tenantId: string) {
    // 1. Seed default test catalog (25 tests)
    const DEFAULT_TESTS = [
      { code: 'CBC',    name: 'Complete Blood Count',           category: 'Haematology',  price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'ESR',    name: 'Erythrocyte Sedimentation Rate', category: 'Haematology',  price: 8000,  sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'LFT',    name: 'Liver Function Test',            category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'KFT',    name: 'Kidney Function Test',           category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'FBS',    name: 'Fasting Blood Sugar',            category: 'Biochemistry', price: 8000,  sampleType: 'Blood', turnaroundHrs: 2 },
      { code: 'HBA1C',  name: 'Glycosylated Haemoglobin',      category: 'Biochemistry', price: 45000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'LIPID',  name: 'Lipid Profile',                  category: 'Biochemistry', price: 55000, sampleType: 'Blood', turnaroundHrs: 12 },
      { code: 'THYROID',name: 'Thyroid Function (T3/T4/TSH)',   category: 'Biochemistry', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'VITD',   name: 'Vitamin D (25-OH)',              category: 'Biochemistry', price: 85000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'VITB12', name: 'Vitamin B12',                    category: 'Biochemistry', price: 65000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'UA',     name: 'Uric Acid',                      category: 'Biochemistry', price: 12000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'CRP',    name: 'C-Reactive Protein',             category: 'Biochemistry', price: 35000, sampleType: 'Blood', turnaroundHrs: 6 },
      { code: 'UCR',    name: 'Urine Complete Routine',         category: 'Urine',        price: 12000, sampleType: 'Urine', turnaroundHrs: 2 },
      { code: 'HBsAg',  name: 'Hepatitis B Surface Antigen',    category: 'Serology',     price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'HIVAB',  name: 'HIV Antibody Test',              category: 'Serology',     price: 25000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'DENGUE', name: 'Dengue NS1 Antigen',             category: 'Serology',     price: 55000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'TSH',    name: 'Thyroid Stimulating Hormone',    category: 'Biochemistry', price: 35000, sampleType: 'Blood', turnaroundHrs: 24 },
      { code: 'WIDAL',  name: 'Widal Test',                     category: 'Serology',     price: 18000, sampleType: 'Blood', turnaroundHrs: 4 },
      { code: 'STOOL',  name: 'Stool Routine & Microscopy',     category: 'Stool',        price: 10000, sampleType: 'Stool', turnaroundHrs: 4 },
      { code: 'BC',     name: 'Blood Culture & Sensitivity',    category: 'Microbiology', price: 85000, sampleType: 'Blood', turnaroundHrs: 72 },
    ];
    for (const test of DEFAULT_TESTS) {
      await this.prisma.testCatalog.upsert({
        where: { tenantId_code: { tenantId, code: test.code } },
        create: { tenantId, ...test, isHomeCollectionAllowed: true },
        update: {},
      }).catch(() => {});
    }

    // 2. Seed 5 default Revenue Engine rules (inactive by default)
    const DEFAULT_RULES = [
      { name: 'HbA1c 90-day reminder',  testCode: 'HBA1C',   triggerEvent: 'TEST_COMPLETED', waitDays: 90,  templateCode: 'T15' },
      { name: 'Thyroid annual reminder', testCode: 'THYROID', triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17' },
      { name: 'Lipid 6-month reminder',  testCode: 'LIPID',   triggerEvent: 'TEST_COMPLETED', waitDays: 180, templateCode: 'T15' },
      { name: 'Vitamin D yearly',        testCode: 'VITD',    triggerEvent: 'TEST_COMPLETED', waitDays: 365, templateCode: 'T17' },
      { name: 'Birthday health offer',   testCode: null,      triggerEvent: 'BIRTHDAY',       waitDays: 0,   templateCode: 'T20' },
    ];
    for (const rule of DEFAULT_RULES) {
      const exists = await this.prisma.diagnosticAutomationRule
        .findFirst({ where: { tenantId, name: rule.name } }).catch(() => null);
      if (!exists) {
        await this.prisma.diagnosticAutomationRule.create({
          data: { tenantId, ...rule, isActive: false, messageText: null },
        }).catch(() => {});
      }
    }

    this.logger.log(`Diagnostic tenant ${tenantId} auto-setup complete: 20 tests + 5 automation rules`);
  }

}