import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Client, CreateClientRequest, UpdateClientRequest } from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

type ClientRow = Prisma.ClientGetPayload<{
  include: { projects: { where: { deletedAt: null }; select: { id: true } } };
}>;

const withActiveProjects = {
  projects: { where: { deletedAt: null }, select: { id: true } },
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(search?: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: withActiveProjects,
      orderBy: { name: 'asc' },
    });
    return clients.map((client) => this.toClient(client));
  }

  async get(id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: withActiveProjects,
    });
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    return this.toClient(client);
  }

  async create(dto: CreateClientRequest, actor: AuthenticatedUser): Promise<Client> {
    const created = await this.prisma.client.create({
      data: {
        name: dto.name,
        contact: dto.contact ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        notes: dto.notes ?? null,
      },
      include: withActiveProjects,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Client',
      entityId: created.id,
      action: 'CREATE',
      after: created,
    });
    return this.toClient(created);
  }

  async update(id: string, dto: UpdateClientRequest, actor: AuthenticatedUser): Promise<Client> {
    const before = await this.prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!before) {
      throw new NotFoundError('Client not found');
    }
    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
      include: withActiveProjects,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Client',
      entityId: id,
      action: 'UPDATE',
      before,
      after: this.stripProjects(updated),
    });
    return this.toClient(updated);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: withActiveProjects,
    });
    if (!client) {
      throw new NotFoundError('Client not found');
    }
    if (client.projects.length > 0) {
      throw new ConflictError('Delete or reassign this client’s projects first');
    }
    await this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Client',
      entityId: id,
      action: 'DELETE',
      before: this.stripProjects(client),
    });
  }

  private toClient(client: ClientRow): Client {
    return {
      id: client.id,
      name: client.name,
      contact: client.contact,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
      projectCount: client.projects.length,
      createdAt: client.createdAt.toISOString(),
    };
  }

  private stripProjects(client: ClientRow): Record<string, unknown> {
    const { projects: _projects, ...rest } = client;
    return rest;
  }
}
