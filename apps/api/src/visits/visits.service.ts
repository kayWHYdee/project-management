import { Injectable } from '@nestjs/common';
import {
  isoDateToUtcDate,
  type CreateVisitRequest,
  type UpdateVisitRequest,
  type Visit,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { mapVisit, type VisitWithRelations } from './visit.mapper';

const WITH_RELATIONS = { project: true, employee: true, system: true } as const;

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForProject(projectId: string): Promise<Visit[]> {
    const visits = await this.prisma.visit.findMany({
      where: { deletedAt: null, projectId, project: { deletedAt: null } },
      include: WITH_RELATIONS,
      orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
    });
    return visits.map(mapVisit);
  }

  async create(
    projectId: string,
    dto: CreateVisitRequest,
    actor: AuthenticatedUser,
  ): Promise<Visit> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    if (dto.systemId) {
      await this.assertSystemInProject(dto.systemId, projectId);
    }

    const created = await this.prisma.visit.create({
      data: {
        projectId,
        employeeId: dto.employeeId,
        systemId: dto.systemId ?? null,
        purpose: dto.purpose ?? null,
        visitDate: isoDateToUtcDate(dto.visitDate),
        hours: dto.hours ?? null,
        photoReceived: dto.photoReceived ?? 'NO',
        createdById: actor.id,
      },
      include: WITH_RELATIONS,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Visit',
      entityId: created.id,
      action: 'CREATE',
      after: this.auditView(created),
    });
    return mapVisit(created);
  }

  async update(id: string, dto: UpdateVisitRequest, actor: AuthenticatedUser): Promise<Visit> {
    const before = await this.prisma.visit.findFirst({
      where: { id, deletedAt: null },
      include: WITH_RELATIONS,
    });
    if (!before) {
      throw new NotFoundError('Visit not found');
    }
    if (dto.employeeId !== undefined) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: dto.employeeId, deletedAt: null },
      });
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
    }
    if (dto.systemId) {
      await this.assertSystemInProject(dto.systemId, before.projectId);
    }

    const data = {
      ...(dto.employeeId !== undefined ? { employeeId: dto.employeeId } : {}),
      ...('systemId' in dto ? { systemId: dto.systemId ?? null } : {}),
      ...('purpose' in dto ? { purpose: dto.purpose ?? null } : {}),
      ...(dto.visitDate !== undefined ? { visitDate: isoDateToUtcDate(dto.visitDate) } : {}),
      ...('hours' in dto ? { hours: dto.hours ?? null } : {}),
      ...(dto.photoReceived !== undefined ? { photoReceived: dto.photoReceived } : {}),
      version: { increment: 1 },
    };

    const result = await this.prisma.visit.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data,
    });
    if (result.count === 0) {
      throw new ConflictError('This visit changed while you were editing. Reload and try again.');
    }

    const after = await this.prisma.visit.findUniqueOrThrow({
      where: { id },
      include: WITH_RELATIONS,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Visit',
      entityId: id,
      action: 'UPDATE',
      before: this.auditView(before),
      after: this.auditView(after),
    });
    return mapVisit(after);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const visit = await this.prisma.visit.findFirst({ where: { id, deletedAt: null } });
    if (!visit) {
      throw new NotFoundError('Visit not found');
    }
    await this.prisma.visit.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Visit',
      entityId: id,
      action: 'DELETE',
      before: visit,
    });
  }

  private async assertSystemInProject(systemId: string, projectId: string): Promise<void> {
    const system = await this.prisma.system.findFirst({
      where: { id: systemId, projectId, deletedAt: null },
    });
    if (!system) {
      throw new NotFoundError('System not found on this project');
    }
  }

  private auditView(visit: VisitWithRelations): Record<string, unknown> {
    const { project: _project, employee: _employee, system: _system, ...rest } = visit;
    return rest;
  }
}
