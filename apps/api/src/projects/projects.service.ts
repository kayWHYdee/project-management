import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AUTO_SYSTEM_TYPES,
  humaniseSystemType,
  isoDateToUtcDate,
  utcDateToIsoDate,
  type CreateProjectRequest,
  type Project,
  type ProjectDetail,
  type ProjectStatus,
  type System,
  type UpdateProjectRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { mapSystem } from '../systems/system.mapper';

export interface ProjectListFilter {
  status?: ProjectStatus;
  clientId?: string;
  search?: string;
}

type ProjectWithClient = Prisma.ProjectGetPayload<{ include: { client: true } }>;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(filter: ProjectListFilter): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.clientId ? { clientId: filter.clientId } : {}),
        ...(filter.search ? { name: { contains: filter.search, mode: 'insensitive' } } : {}),
      },
      include: { client: true },
      orderBy: { updatedAt: 'desc' },
    });
    return projects.map((project) => this.toProject(project));
  }

  async getDetail(id: string): Promise<ProjectDetail> {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        systems: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    const systems: System[] = project.systems.map(mapSystem);
    return { ...this.toProject(project), systems };
  }

  async create(dto: CreateProjectRequest, actor: AuthenticatedUser): Promise<ProjectDetail> {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, deletedAt: null },
    });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          status: dto.status ?? 'ENQUIRY',
          address: dto.address ?? null,
          description: dto.description ?? null,
          budgetValue: dto.budgetValue ?? null,
          startDate: dto.startDate ? isoDateToUtcDate(dto.startDate) : null,
          notes: dto.notes ?? null,
        },
      });
      // Every project gets a Spares and a Consumables system automatically.
      await tx.system.createMany({
        data: AUTO_SYSTEM_TYPES.map((type) => ({
          projectId: project.id,
          type,
          label: humaniseSystemType(type),
        })),
      });
      return project;
    });

    await this.audit.record({
      userId: actor.id,
      entity: 'Project',
      entityId: created.id,
      action: 'CREATE',
      after: created,
    });
    return this.getDetail(created.id);
  }

  async update(
    id: string,
    dto: UpdateProjectRequest,
    actor: AuthenticatedUser,
  ): Promise<ProjectDetail> {
    const before = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!before) {
      throw new NotFoundError('Project not found');
    }

    const result = await this.prisma.project.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data: { ...this.buildUpdateData(dto), version: { increment: 1 } },
    });
    if (result.count === 0) {
      // Row exists (checked above) but the version guard failed → stale edit.
      throw new ConflictError('This project changed while you were editing. Reload and try again.');
    }

    const after = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Project',
      entityId: id,
      action: 'UPDATE',
      before,
      after,
    });
    return this.getDetail(id);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.system.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.project.update({ where: { id }, data: { deletedAt: now } }),
    ]);
    await this.audit.record({
      userId: actor.id,
      entity: 'Project',
      entityId: id,
      action: 'DELETE',
      before: project,
    });
  }

  private buildUpdateData(dto: UpdateProjectRequest): Prisma.ProjectUpdateInput {
    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.status !== undefined) data.status = dto.status;
    if ('address' in dto) data.address = dto.address ?? null;
    if ('description' in dto) data.description = dto.description ?? null;
    if ('budgetValue' in dto) data.budgetValue = dto.budgetValue ?? null;
    if ('startDate' in dto) data.startDate = dto.startDate ? isoDateToUtcDate(dto.startDate) : null;
    if ('notes' in dto) data.notes = dto.notes ?? null;
    return data;
  }

  private toProject(project: ProjectWithClient): Project {
    return {
      id: project.id,
      clientId: project.clientId,
      clientName: project.client.name,
      name: project.name,
      status: project.status,
      address: project.address,
      description: project.description,
      budgetValue: project.budgetValue ? project.budgetValue.toFixed(2) : null,
      startDate: project.startDate ? utcDateToIsoDate(project.startDate) : null,
      notes: project.notes,
      version: project.version,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
