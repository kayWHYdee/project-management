import { Injectable } from '@nestjs/common';
import {
  AUTO_SYSTEM_TYPES,
  humaniseSystemType,
  type CreateSystemRequest,
  type System,
  type UpdateSystemRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { mapSystem } from './system.mapper';

@Injectable()
export class SystemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async addToProject(
    projectId: string,
    dto: CreateSystemRequest,
    actor: AuthenticatedUser,
  ): Promise<System> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    if (AUTO_SYSTEM_TYPES.includes(dto.type)) {
      throw new ConflictError('Spares and Consumables are created automatically');
    }

    const created = await this.prisma.system.create({
      data: {
        projectId,
        type: dto.type,
        label: dto.label ?? humaniseSystemType(dto.type),
        notes: dto.notes ?? null,
      },
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'System',
      entityId: created.id,
      action: 'CREATE',
      after: created,
    });
    return mapSystem(created);
  }

  async update(id: string, dto: UpdateSystemRequest, actor: AuthenticatedUser): Promise<System> {
    const before = await this.prisma.system.findFirst({ where: { id, deletedAt: null } });
    if (!before) {
      throw new NotFoundError('System not found');
    }
    const updated = await this.prisma.system.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...('notes' in dto ? { notes: dto.notes ?? null } : {}),
      },
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'System',
      entityId: id,
      action: 'UPDATE',
      before,
      after: updated,
    });
    return mapSystem(updated);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const system = await this.prisma.system.findFirst({ where: { id, deletedAt: null } });
    if (!system) {
      throw new NotFoundError('System not found');
    }
    if (AUTO_SYSTEM_TYPES.includes(system.type)) {
      throw new ConflictError('Spares and Consumables systems cannot be removed');
    }
    await this.prisma.system.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'System',
      entityId: id,
      action: 'DELETE',
      before: system,
    });
  }
}
