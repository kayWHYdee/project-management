import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ClientsService } from './clients.service';

const actor: AuthenticatedUser = { id: 'u1', name: 'A', email: 'a@b.com', role: 'EDITOR' };

describe('ClientsService.remove', () => {
  const findFirst = vi.fn();
  const update = vi.fn();

  const service = new ClientsService(
    { client: { findFirst, update } } as unknown as PrismaService,
    { record: vi.fn() } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('blocks deleting a client that still has active projects', async () => {
    findFirst.mockResolvedValue({ id: 'c1', projects: [{ id: 'p1' }] });

    await expect(service.remove('c1', actor)).rejects.toBeInstanceOf(ConflictError);
    expect(update).not.toHaveBeenCalled();
  });

  it('soft-deletes a client with no active projects', async () => {
    findFirst.mockResolvedValue({ id: 'c1', projects: [] });
    update.mockResolvedValue({ id: 'c1' });

    await service.remove('c1', actor);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});
