import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Extract current authenticated user from request.
 * Usage: @CurrentUser() user  OR  @CurrentUser('id') userId
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * Extract current tenant ID from authenticated user.
 * Usage: @CurrentTenant() tenantId
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);

/**
 * Set required roles for an endpoint.
 * Usage: @Roles('TENANT_ADMIN', 'DOCTOR')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
