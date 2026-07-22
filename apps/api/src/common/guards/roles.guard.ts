import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@water-pm/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenError, UnauthorizedError } from '../errors/domain-error';
import type { RequestWithUser } from '../auth/authenticated-user';

/**
 * Enforces `@Roles(...)` metadata. Runs after AuthGuard, so `request.user` is
 * present. Routes without `@Roles` are allowed for any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError('You do not have access to this resource');
    }
    return true;
  }
}
