import type { CreateSystemRequest } from '@water-pm/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { SystemsService } from './systems.service';

const actor: AuthenticatedUser = { id: 'u1', name: 'A', email: 'a@b.com', role: 'EDITOR' };

describe('SystemsService protects the auto-created systems', () => {
  const systemFindFirst = vi.fn();
  const systemUpdate = vi.fn();
  const systemCreate = vi.fn();
  const projectFindFirst = vi.fn();

  const service = new SystemsService(
    {
      system: { findFirst: systemFindFirst, update: systemUpdate, create: systemCreate },
      project: { findFirst: projectFindFirst },
    } as unknown as PrismaService,
    { record: vi.fn() } as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('refuses to remove a Spares/Consumables system', async () => {
    systemFindFirst.mockResolvedValue({ id: 's1', type: 'CONSUMABLES' });

    await expect(service.remove('s1', actor)).rejects.toBeInstanceOf(ConflictError);
    expect(systemUpdate).not.toHaveBeenCalled();
  });

  it('refuses to manually create a Spares/Consumables system', async () => {
    projectFindFirst.mockResolvedValue({ id: 'p1' });

    await expect(
      service.addToProject('p1', { type: 'SPARES' } as CreateSystemRequest, actor),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(systemCreate).not.toHaveBeenCalled();
  });
});
