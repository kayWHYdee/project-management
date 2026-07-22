import type { User as PrismaUser } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { SessionService } from '../auth/session.service';
import { UsersService } from './users.service';

function makeUser(overrides: Partial<PrismaUser>): PrismaUser {
  return {
    id: 'u1',
    name: 'Owner',
    email: 'owner@example.com',
    passwordHash: 'hash',
    role: 'OWNER',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const actor: AuthenticatedUser = {
  id: 'admin',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'OWNER',
};

describe('UsersService last-owner guard', () => {
  const findUnique = vi.fn();
  const update = vi.fn();
  const count = vi.fn();
  const revokeAllForUser = vi.fn();
  const record = vi.fn();

  const service = new UsersService(
    { user: { findUnique, update, count } } as unknown as PrismaService,
    {} as unknown as PasswordService,
    { revokeAllForUser } as unknown as SessionService,
    { record } as unknown as AuditService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks demoting the last active owner', async () => {
    findUnique.mockResolvedValue(makeUser({ id: 'u1', role: 'OWNER', isActive: true }));
    count.mockResolvedValue(0);

    await expect(service.update('u1', { role: 'EDITOR' }, actor)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('blocks deactivating the last active owner', async () => {
    findUnique.mockResolvedValue(makeUser({ id: 'u1', role: 'OWNER', isActive: true }));
    count.mockResolvedValue(0);

    await expect(service.update('u1', { isActive: false }, actor)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('allows demotion when another active owner exists and revokes sessions', async () => {
    findUnique.mockResolvedValue(makeUser({ id: 'u1', role: 'OWNER', isActive: true }));
    count.mockResolvedValue(1);
    update.mockResolvedValue(makeUser({ id: 'u1', role: 'EDITOR', isActive: true }));

    const result = await service.update('u1', { role: 'EDITOR' }, actor);

    expect(result.role).toBe('EDITOR');
    expect(update).toHaveBeenCalledOnce();
    expect(revokeAllForUser).toHaveBeenCalledWith('u1');
    expect(record).toHaveBeenCalledOnce();
  });
});
