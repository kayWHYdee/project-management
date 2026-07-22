import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { UnauthorizedError } from '../../common/errors/domain-error';
import type { RequestWithUser } from '../../common/auth/authenticated-user';
import { SessionService } from '../session.service';
import { SESSION_COOKIE } from '../session-cookie';

/**
 * Global guard. Allows routes marked `@Public()`; otherwise requires a valid
 * session cookie and attaches the user to the request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const signedCookies = request.signedCookies as Record<string, unknown> | undefined;
    const token = signedCookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await this.sessions.validate(token);
    if (!user) {
      throw new UnauthorizedError('Your session has expired. Please sign in again.');
    }

    request.user = user;
    return true;
  }
}
