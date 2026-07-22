import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_WHEN_REMAINING_MS = SESSION_TTL_MS / 2;

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

/**
 * DB-backed sessions. The cookie carries a random token; only its SHA-256 hash
 * is stored, so a database leak does not expose usable sessions. Sessions are
 * hard-deleted on logout / expiry — they are infrastructure, not domain data.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(userId: string): Promise<IssuedSession> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { userId, tokenHash: this.hash(token), expiresAt },
    });
    return { token, expiresAt };
  }

  /**
   * Validates a token, returns the authenticated user, and slides the expiry
   * forward when the session is past half its life. Returns null for any
   * invalid/expired/inactive case.
   */
  async validate(token: string): Promise<AuthenticatedUser | null> {
    const tokenHash = this.hash(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (!session.user.isActive) {
      await this.revokeAllForUser(session.userId);
      return null;
    }

    if (session.expiresAt.getTime() - Date.now() < REFRESH_WHEN_REMAINING_MS) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      });
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.session
      .delete({ where: { tokenHash: this.hash(token) } })
      .catch(() => undefined);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
