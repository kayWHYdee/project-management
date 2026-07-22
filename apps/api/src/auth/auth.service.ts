import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { ChangePasswordRequest, LoginRequest, SessionUser } from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { UnauthorizedError, ValidationError } from '../common/errors/domain-error';
import { PasswordService } from './password.service';
import { SessionService, type IssuedSession } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginRequest): Promise<{ user: SessionUser; session: IssuedSession }> {
    // One generic message for every failure so a caller can't tell "no such
    // user" from "wrong password" or "deactivated".
    const invalid = new UnauthorizedError('Invalid email or password');

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw invalid;
    }
    const ok = await this.passwords.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw invalid;
    }

    const session = await this.sessions.issue(user.id);
    await this.audit.record({
      userId: user.id,
      entity: 'Auth',
      entityId: user.id,
      action: 'LOGIN',
    });
    return { user: this.toSessionUser(user), session };
  }

  async logout(userId: string, token: string): Promise<void> {
    await this.sessions.revoke(token);
    await this.audit.record({ userId, entity: 'Auth', entityId: userId, action: 'LOGOUT' });
  }

  async changePassword(userId: string, dto: ChangePasswordRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    const ok = await this.passwords.verify(user.passwordHash, dto.currentPassword);
    if (!ok) {
      throw new ValidationError('Current password is incorrect', {
        currentPassword: ['Current password is incorrect'],
      });
    }

    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Force re-login everywhere after a password change.
    await this.sessions.revokeAllForUser(userId);
    await this.audit.record({
      userId,
      entity: 'Auth',
      entityId: userId,
      action: 'PASSWORD_CHANGE',
    });
  }

  private toSessionUser(user: User): SessionUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
