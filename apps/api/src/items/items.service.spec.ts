import { Prisma } from '@prisma/client';
import type { CreateItemRequest } from '@water-pm/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ItemsService } from './items.service';

const actor: AuthenticatedUser = { id: 'u1', name: 'A', email: 'a@b.com', role: 'EDITOR' };

describe('ItemsService.create', () => {
  const create = vi.fn();
  const record = vi.fn();
  const service = new ItemsService(
    { item: { create } } as unknown as PrismaService,
    { record } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('maps a duplicate-name violation to a conflict with a field error', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6.0.0' }),
    );

    await expect(
      service.create({ name: 'Pump' } as CreateItemRequest, actor),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('creates an item and records an audit row', async () => {
    create.mockResolvedValue({
      id: 'i1',
      name: 'New Widget',
      category: 'OTHER',
      isActive: true,
      sortOrder: 1_000_000,
    });

    const result = await service.create({ name: 'New Widget' } as CreateItemRequest, actor);
    expect(result.name).toBe('New Widget');
    expect(record).toHaveBeenCalledOnce();
  });
});
