import type { UpdateProjectRequest } from '@water-pm/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ProjectsService } from './projects.service';

const actor: AuthenticatedUser = {
  id: 'u1',
  name: 'A',
  email: 'a@b.com',
  role: 'EDITOR',
};

describe('ProjectsService.update optimistic locking', () => {
  const findFirst = vi.fn();
  const updateMany = vi.fn();
  const record = vi.fn();

  const service = new ProjectsService(
    { project: { findFirst, updateMany } } as unknown as PrismaService,
    { record } as unknown as AuditService,
  );

  const dto = { version: 3, status: 'IN_PROGRESS' } as UpdateProjectRequest;

  beforeEach(() => vi.clearAllMocks());

  it('rejects a stale update (version guard matched no row) with 409', async () => {
    findFirst.mockResolvedValue({ id: 'p1', version: 4 });
    updateMany.mockResolvedValue({ count: 0 });

    await expect(service.update('p1', dto, actor)).rejects.toBeInstanceOf(ConflictError);
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects an update to a missing project with 404', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.update('missing', dto, actor)).rejects.toBeInstanceOf(NotFoundError);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
