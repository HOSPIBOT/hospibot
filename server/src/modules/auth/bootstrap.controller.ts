import { Controller, Post, Body, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';

/**
 * ONE-TIME bootstrap endpoint — creates super admin + seeds portal families.
 * Protected by a secret key. Safe to leave deployed.
 */
@Controller('bootstrap')
export class BootstrapController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }

  @Post('init')
  async init(@Body() body: { secret: string; email: string; password: string; name?: string }) {
    const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || 'hospibot-init-2026';
    if (body.secret !== BOOTSTRAP_SECRET) {
      return { success: false, message: 'Invalid secret' };
    }

    const results: string[] = [];

    // 1. Seed portal families if not present
    const existing = await this.prisma.portalFamily.count();
    if (existing === 0) {
      const families = [
        { name: 'Clinical',    slug: 'clinical',    icon: 'Stethoscope', sortOrder: 1,
          theme: { primaryColor:'#0D7C66', primaryDark:'#0A5E4F', primaryLight:'#E8F5F0', accentColor:'#F59E0B', sidebarBg:'#063A31', loginBg:'#0D7C66', loginGradient:'#0A5E4F' } },
        { name: 'Diagnostic',  slug: 'diagnostic',  icon: 'FlaskConical', sortOrder: 2,
          theme: { primaryColor:'#7C3AED', primaryDark:'#5B21B6', primaryLight:'#EDE9FE', accentColor:'#F59E0B', sidebarBg:'#2E1065', loginBg:'#7C3AED', loginGradient:'#5B21B6' } },
        { name: 'Pharmacy',    slug: 'pharmacy',    icon: 'Pill',         sortOrder: 3,
          theme: { primaryColor:'#0284C7', primaryDark:'#0369A1', primaryLight:'#E0F2FE', accentColor:'#F59E0B', sidebarBg:'#0C2340', loginBg:'#0284C7', loginGradient:'#0369A1' } },
        { name: 'Equipment',   slug: 'equipment',   icon: 'Package',      sortOrder: 4,
          theme: { primaryColor:'#B45309', primaryDark:'#92400E', primaryLight:'#FEF3C7', accentColor:'#10B981', sidebarBg:'#3B1A08', loginBg:'#B45309', loginGradient:'#92400E' } },
        { name: 'Wellness',    slug: 'wellness',    icon: 'Heart',        sortOrder: 5,
          theme: { primaryColor:'#DB2777', primaryDark:'#9D174D', primaryLight:'#FCE7F3', accentColor:'#F59E0B', sidebarBg:'#3B0764', loginBg:'#DB2777', loginGradient:'#9D174D' } },
        { name: 'Services',    slug: 'services',    icon: 'Briefcase',    sortOrder: 6,
          theme: { primaryColor:'#059669', primaryDark:'#047857', primaryLight:'#D1FAE5', accentColor:'#F59E0B', sidebarBg:'#022C22', loginBg:'#059669', loginGradient:'#047857' } },
        { name: 'Home Care',   slug: 'homecare',    icon: 'Home',         sortOrder: 7,
          theme: { primaryColor:'#DC2626', primaryDark:'#B91C1C', primaryLight:'#FEE2E2', accentColor:'#F59E0B', sidebarBg:'#450A0A', loginBg:'#DC2626', loginGradient:'#B91C1C' } },
      ];
      for (const f of families) {
        await this.prisma.portalFamily.create({ data: { name: f.name, slug: f.slug, icon: f.icon as any, sortOrder: f.sortOrder, description: f.name } as any });
      }
      results.push(`Seeded ${families.length} portal families`);
    } else {
      results.push(`Portal families already exist (${existing})`);
    }

    // 2. Create super admin if not present
    const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existingAdmin) {
      results.push(`Super admin already exists: ${existingAdmin.email}`);
    } else {
      const passwordHash = await bcrypt.hash(body.password, 12);
      await this.prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          firstName: body.name || 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
          tenantId: null,
        },
      });
      results.push(`Super admin created: ${body.email}`);
    }

    return { success: true, results };
  }
}
