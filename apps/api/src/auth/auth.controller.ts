import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  type SessionUser,
} from '@water-pm/shared';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser, RequestWithUser } from '../common/auth/authenticated-user';
import { AppConfigService } from '../config/app-config.service';
import { AuthService } from './auth.service';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) dto: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionUser> {
    const { user, session } = await this.auth.login(dto);
    setSessionCookie(response, session.token, session.expiresAt, {
      secure: this.config.cookieSecure,
    });
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = (request.signedCookies as Record<string, unknown> | undefined)?.[SESSION_COOKIE];
    if (typeof token === 'string') {
      await this.auth.logout(user.id, token);
    }
    clearSessionCookie(response, { secure: this.config.cookieSecure });
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): SessionUser {
    return user;
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordRequestSchema))
    dto: { currentPassword: string; newPassword: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto);
    clearSessionCookie(response, { secure: this.config.cookieSecure });
  }
}
