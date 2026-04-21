import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check with DB connectivity' })
  async check() {
    const dbOk = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    return {
      status: dbOk ? 'ok' : 'degraded',
      service: 'hospibot-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: dbOk ? 'connected' : 'disconnected',
    };
  }
}
