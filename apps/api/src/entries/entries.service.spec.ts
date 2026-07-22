import type { CreateEntryRequest, UpdateEntryRequest } from '@water-pm/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, ValidationError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { EntriesService } from './entries.service';

const actor: AuthenticatedUser = { id: 'u1', name: 'A', email: 'a@b.com', role: 'EDITOR' };

const decimal = (value: number) => ({ toFixed: (n: number) => value.toFixed(n) });

// A well-formed Prisma-ish entry row so mapEntry can run over the create result.
const entryRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'e1',
  systemId: 's1',
  itemId: 'i1',
  customName: null,
  description: null,
  quantity: decimal(3),
  unit: 'nos',
  sentOn: new Date('2026-07-22T00:00:00.000Z'),
  receivedBy: null,
  rate: decimal(150),
  amount: decimal(450),
  notes: null,
  version: 0,
  createdAt: new Date('2026-07-22T00:00:00.000Z'),
  system: { label: 'Main pool', type: 'POOL' },
  item: { name: 'Pump' },
  ...overrides,
});

describe('EntriesService.create', () => {
  const systemFindFirst = vi.fn();
  const itemFindUnique = vi.fn();
  const entryCreate = vi.fn();

  const service = new EntriesService(
    {
      system: { findFirst: systemFindFirst },
      item: { findUnique: itemFindUnique },
      entry: { create: entryCreate },
    } as unknown as PrismaService,
    { record: vi.fn() } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('computes amount = quantity × rate when a rate is present', async () => {
    systemFindFirst.mockResolvedValue({ id: 's1', type: 'POOL' });
    itemFindUnique.mockResolvedValue({ id: 'i1' });
    entryCreate.mockResolvedValue(entryRow());

    await service.create(
      {
        systemId: 's1',
        itemId: 'i1',
        quantity: '3',
        rate: '150.00',
        sentOn: '2026-07-22',
      } as CreateEntryRequest,
      actor,
    );

    expect(entryCreate).toHaveBeenCalledOnce();
    expect(entryCreate.mock.calls[0]?.[0]?.data?.amount).toBe('450.00');
  });

  it('rejects a custom name on a non-Spares system', async () => {
    systemFindFirst.mockResolvedValue({ id: 's1', type: 'POOL' });

    await expect(
      service.create(
        {
          systemId: 's1',
          customName: 'One-off',
          quantity: '1',
          sentOn: '2026-07-22',
        } as CreateEntryRequest,
        actor,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(entryCreate).not.toHaveBeenCalled();
  });

  it('allows a custom name on a Spares system', async () => {
    systemFindFirst.mockResolvedValue({ id: 's1', type: 'SPARES' });
    entryCreate.mockResolvedValue(entryRow({ itemId: null, customName: 'One-off', item: null }));

    await service.create(
      {
        systemId: 's1',
        customName: 'One-off',
        quantity: '1',
        sentOn: '2026-07-22',
      } as CreateEntryRequest,
      actor,
    );
    expect(entryCreate).toHaveBeenCalledOnce();
  });
});

describe('EntriesService.update optimistic locking', () => {
  const entryFindFirst = vi.fn();
  const entryUpdateMany = vi.fn();

  const service = new EntriesService(
    {
      entry: { findFirst: entryFindFirst, updateMany: entryUpdateMany },
    } as unknown as PrismaService,
    { record: vi.fn() } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('rejects a stale update with 409', async () => {
    entryFindFirst.mockResolvedValue(entryRow({ quantity: decimal(3), rate: null, amount: null }));
    entryUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update('e1', { version: 2, quantity: '5' } as UpdateEntryRequest, actor),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
