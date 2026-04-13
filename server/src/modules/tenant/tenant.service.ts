import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }


  async createBranch(tenantId: string, dto: any) {
    return this.prisma.branch.create({
      data: {
        tenantId,
        name:     dto.name,
        address:  dto.address,
        city:     dto.city,
        state:    dto.state,
        pincode:  dto.pincode,
        phone:    dto.phone,
        email:    dto.email,
        isActive: true,
        isMain:   dto.isMain || false,
      },
    });
  }

  async updateBranch(tenantId: string, branchId: string, dto: any) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  async updateSettings(tenantId: string, settings: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
  }

  async getBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}


  async createBranch(tenantId: string, dto: any) {
    return this.prisma.branch.create({
      data: {
        tenantId,
        name:     dto.name,
        address:  dto.address,
        city:     dto.city,
        state:    dto.state,
        pincode:  dto.pincode,
        phone:    dto.phone,
        email:    dto.email,
        isActive: true,
        isMain:   dto.isMain || false,
      },
    });
  }

  async updateBranch(tenantId: string, branchId: string, dto: any) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  async updateSettings(tenantId: string, dto: any): Promise<any> {
    // Deep-merge settings — preserve existing keys, overwrite provided ones
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const currentSettings = (existing?.settings as any) || {};
    const mergedSettings = { ...currentSettings, ...dto };

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: mergedSettings },
      select: { id: true, name: true, settings: true },
    });
  }

  async update(tenantId: string, dto: any): Promise<any> {
    const allowed = [
      'name', 'phone', 'email', 'website', 'address', 'city',
      'state', 'pincode', 'gstNumber', 'logoUrl', 'settings',
    ];
    const data: any = {};
    for (const key of allowed) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }
