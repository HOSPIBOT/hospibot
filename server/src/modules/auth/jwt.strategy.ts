import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // SUPER_ADMIN tokens are issued with role='SUPER_ADMIN' and tenantId=null
    // Their IDs live in platform_admins, not users
    if (payload.role === 'SUPER_ADMIN') {
      const admin = await this.prisma.platformAdmin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Account is inactive or not found');
      }
      return {
        id: admin.id,
        tenantId: null,
        branchId: null,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: [],
      };
    }

    // Regular tenant users
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
    };
  }
}

