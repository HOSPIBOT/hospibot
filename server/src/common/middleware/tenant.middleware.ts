import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';

/**
 * Sets PostgreSQL Row-Level Security context based on authenticated user's tenant.
 * This ensures every database query is automatically scoped to the correct tenant.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user?.tenantId) {
      await this.prisma.setTenantContext(user.tenantId);
    }

    next();
  }
}
