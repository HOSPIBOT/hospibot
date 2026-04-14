import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('HRMS')
@Controller('hrms')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class HrmsController {
  constructor(private prisma: PrismaService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Get staff attendance records' })
  async getAttendance(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    // Attendance records stored as audit logs with action='ATTENDANCE'
    try {
      const where: any = { tenantId, action: 'ATTENDANCE' };
      if (userId) where.userId = userId;
      if (date) {
        const start = new Date(date); start.setHours(0,0,0,0);
        const end = new Date(date); end.setHours(23,59,59,999);
        where.createdAt = { gte: start, lte: end };
      }
      const records = await this.prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 200,
      }).catch(() => []);
      return { data: records, meta: { total: records.length } };
    } catch {
      return { data: [], meta: { total: 0 } };
    }
  }

  @Post('attendance')
  @ApiOperation({ summary: 'Record staff attendance (check-in/check-out)' })
  async recordAttendance(
    @CurrentTenant() tenantId: string,
    @Body() body: { userId: string; type: 'CHECK_IN' | 'CHECK_OUT'; notes?: string },
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: body.userId,
          action: 'ATTENDANCE',
          entity: 'hrms',
          changes: { type: body.type, notes: body.notes, timestamp: new Date() },
        },
      });
      return { success: true, type: body.type, timestamp: new Date() };
    } catch {
      return { success: false, message: 'Failed to record attendance' };
    }
  }

  @Get('payroll')
  @ApiOperation({ summary: 'Get payroll summary' })
  async getPayroll(@CurrentTenant() tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true, email: true },
      take: 100,
    }).catch(() => []);
    return { data: users.map(u => ({ ...u, salary: 0, daysWorked: 0, deductions: 0, netPay: 0 })) };
  }
}
