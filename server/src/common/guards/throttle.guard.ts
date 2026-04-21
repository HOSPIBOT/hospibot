import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * SimpleThrottleGuard — in-memory rate limiter.
 * 
 * Limits: 100 requests per minute per IP for public endpoints.
 * Applied globally via APP_GUARD in app.module.
 * 
 * For production, replace with Redis-backed @nestjs/throttler.
 */
@Injectable()
export class SimpleThrottleGuard implements CanActivate {
  private store = new Map<string, { count: number; resetAt: number }>();
  private readonly limit = 100;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = this.store.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(ip, entry);
    }

    entry.count++;

    if (entry.count > this.limit) {
      throw new HttpException('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Cleanup old entries every 1000 requests
    if (this.store.size > 10000) {
      for (const [key, val] of this.store) {
        if (now > val.resetAt) this.store.delete(key);
      }
    }

    return true;
  }
}
