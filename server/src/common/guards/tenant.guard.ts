import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * TenantGuard: Ensures the authenticated user has a valid tenantId.
 * Blocks SUPER_ADMIN and any user with null tenantId from accessing
 * tenant-scoped endpoints. Apply to any controller that uses @CurrentTenant().
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Authentication required');
    if (!user.tenantId || user.tenantId === null) {
      throw new ForbiddenException(
        'This endpoint requires a tenant-scoped account. ' +
        'Super Admin accounts cannot access tenant resources directly.'
      );
    }
    return true;
  }
}
