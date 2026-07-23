import { Prisma } from '@prisma/client';
import type { CreateItemRequest } from '@water-pm/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, ValidationError } from '../common/errors/domain-error';
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

describe('ItemsService.merge', () => {
  const findUnique = vi.fn();
  const entryUpdateMany = vi.fn();
  const itemUpdate = vi.fn();
  const record = vi.fn();

  const service = new ItemsService(
    {
      item: { findUnique, update: itemUpdate },
      $transaction: (cb: (tx: unknown) => unknown) =>
        cb({ entry: { updateMany: entryUpdateMany }, item: { update: itemUpdate } }),
    } as unknown as PrismaService,
    { record } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('refuses to merge an item into itself', async () => {
    await expect(service.merge('i1', 'i1', actor)).rejects.toBeInstanceOf(ValidationError);
  });

  it('repoints entries to the target and reports how many moved', async () => {
    findUnique.mockImplementation(({ where }: { where: { id: string } }) => ({ id: where.id }));
    entryUpdateMany.mockResolvedValue({ count: 4 });

    const result = await service.merge('src', 'dst', actor);

    expect(entryUpdateMany).toHaveBeenCalledWith({
      where: { itemId: 'src' },
      data: { itemId: 'dst' },
    });
    expect(itemUpdate).toHaveBeenCalledWith({ where: { id: 'src' }, data: { isActive: false } });
    expect(result.movedCount).toBe(4);
    expect(record).toHaveBeenCalledOnce();
  });
});
