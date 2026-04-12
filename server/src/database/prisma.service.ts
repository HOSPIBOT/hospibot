import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set tenant context for Row-Level Security.
   * Call this at the start of every request via middleware.
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(
      `SET app.current_tenant_id = '${tenantId}'`
    );
  }

  /**
   * Clear tenant context after request completes.
   */
  async clearTenantContext() {
    await this.$executeRawUnsafe(
      `RESET app.current_tenant_id`
    );
  }
}
