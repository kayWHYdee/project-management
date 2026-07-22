import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { UnauthorizedError } from '../errors/domain-error';
import type { AuthenticatedUser, RequestWithUser } from '../auth/authenticated-user';

/** Injects the authenticated user attached by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    return request.user;
  },
);
