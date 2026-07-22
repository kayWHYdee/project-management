import { Injectable } from '@nestjs/common';
import {
  allowsCustomName,
  computeAmount,
  isoDateToUtcDate,
  type CreateEntryRequest,
  type Entry,
  type UpdateEntryRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError, ValidationError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { mapEntry, type EntryWithRelations } from './entry.mapper';

const WITH_RELATIONS = { system: true, item: true } as const;

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForProject(projectId: string): Promise<Entry[]> {
    const entries = await this.prisma.entry.findMany({
      where: { deletedAt: null, system: { projectId, deletedAt: null } },
      include: WITH_RELATIONS,
      orderBy: [{ sentOn: 'desc' }, { createdAt: 'desc' }],
    });
    return entries.map(mapEntry);
  }

  async create(dto: CreateEntryRequest, actor: AuthenticatedUser): Promise<Entry> {
    const system = await this.prisma.system.findFirst({
      where: { id: dto.systemId, deletedAt: null, project: { deletedAt: null } },
    });
    if (!system) {
      throw new NotFoundError('System not found');
    }
    if (dto.customName && !allowsCustomName(system.type)) {
      throw new ValidationError('Custom names are only allowed for Spares and Consumables', {
        customName: ['Only Spares and Consumables systems accept a custom name'],
      });
    }
    if (dto.itemId) {
      const item = await this.prisma.item.findUnique({ where: { id: dto.itemId } });
      if (!item) {
        throw new NotFoundError('Item not found');
      }
    }

    const amount = this.resolveAmount(dto.quantity, dto.rate ?? null, dto.amount ?? null);
    const created = await this.prisma.entry.create({
      data: {
        systemId: dto.systemId,
        itemId: dto.itemId ?? null,
        customName: dto.customName ?? null,
        description: dto.description ?? null,
        quantity: dto.quantity,
        unit: dto.unit ?? 'nos',
        sentOn: isoDateToUtcDate(dto.sentOn),
        receivedBy: dto.receivedBy ?? null,
        rate: dto.rate ?? null,
        amount,
        notes: dto.notes ?? null,
        createdById: actor.id,
      },
      include: WITH_RELATIONS,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Entry',
      entityId: created.id,
      action: 'CREATE',
      after: this.auditView(created),
    });
    return mapEntry(created);
  }

  private auditView(entry: EntryWithRelations): Record<string, unknown> {
    const { system: _system, item: _item, ...rest } = entry;
    return rest;
  }

  async update(id: string, dto: UpdateEntryRequest, actor: AuthenticatedUser): Promise<Entry> {
    const before = await this.prisma.entry.findFirst({
      where: { id, deletedAt: null },
      include: WITH_RELATIONS,
    });
    if (!before) {
      throw new NotFoundError('Entry not found');
    }

    const quantity = dto.quantity ?? before.quantity.toFixed(3);
    const rate = 'rate' in dto ? (dto.rate ?? null) : before.rate ? before.rate.toFixed(2) : null;
    const manualAmount =
      'amount' in dto ? (dto.amount ?? null) : before.amount ? before.amount.toFixed(2) : null;
    const amount = this.resolveAmount(quantity, rate, manualAmount);

    const data = {
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...('rate' in dto ? { rate } : {}),
      amount,
      ...('description' in dto ? { description: dto.description ?? null } : {}),
      ...('unit' in dto ? { unit: dto.unit ?? 'nos' } : {}),
      ...(dto.sentOn !== undefined ? { sentOn: isoDateToUtcDate(dto.sentOn) } : {}),
      ...('receivedBy' in dto ? { receivedBy: dto.receivedBy ?? null } : {}),
      ...('notes' in dto ? { notes: dto.notes ?? null } : {}),
      version: { increment: 1 },
    };

    const result = await this.prisma.entry.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data,
    });
    if (result.count === 0) {
      throw new ConflictError('This entry changed while you were editing. Reload and try again.');
    }

    const after = await this.prisma.entry.findUniqueOrThrow({
      where: { id },
      include: WITH_RELATIONS,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Entry',
      entityId: id,
      action: 'UPDATE',
      before: this.auditView(before),
      after: this.auditView(after),
    });
    return mapEntry(after);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const entry = await this.prisma.entry.findFirst({ where: { id, deletedAt: null } });
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }
    await this.prisma.entry.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Entry',
      entityId: id,
      action: 'DELETE',
      before: entry,
    });
  }

  /** Rate present ⇒ amount is derived and authoritative; otherwise it's manual. */
  private resolveAmount(
    quantity: string,
    rate: string | null,
    manualAmount: string | null,
  ): string | null {
    if (rate !== null) {
      return computeAmount(quantity, rate);
    }
    return manualAmount;
  }
}
