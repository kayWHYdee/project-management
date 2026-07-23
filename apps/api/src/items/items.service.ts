import { Injectable } from '@nestjs/common';
import { Prisma, type Item as PrismaItem } from '@prisma/client';
import type {
  CreateItemRequest,
  Item,
  ManagedItem,
  MergeItemsResult,
  UpdateItemRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError, ValidationError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

const ACTIVE_ENTRY_COUNT = { entries: { where: { deletedAt: null } } } as const;
type ItemWithUsage = Prisma.ItemGetPayload<{
  include: { _count: { select: typeof ACTIVE_ENTRY_COUNT } };
}>;

// User-added items sort after the curated seed catalog (which uses 0, 10, 20…).
const USER_ITEM_SORT_ORDER = 1_000_000;

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(includeInactive: boolean): Promise<Item[]> {
    const items = await this.prisma.item.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toItem(item));
  }

  async create(dto: CreateItemRequest, actor: AuthenticatedUser): Promise<Item> {
    try {
      const created = await this.prisma.item.create({
        data: {
          name: dto.name,
          category: dto.category ?? 'OTHER',
          sortOrder: USER_ITEM_SORT_ORDER,
        },
      });
      await this.audit.record({
        userId: actor.id,
        entity: 'Item',
        entityId: created.id,
        action: 'CREATE',
        after: created,
      });
      return this.toItem(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('An item with this name already exists', {
          name: ['An item with this name already exists'],
        });
      }
      throw error;
    }
  }

  async listManaged(): Promise<ManagedItem[]> {
    const items = await this.prisma.item.findMany({
      include: { _count: { select: ACTIVE_ENTRY_COUNT } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toManaged(item));
  }

  async update(id: string, dto: UpdateItemRequest, actor: AuthenticatedUser): Promise<ManagedItem> {
    const before = await this.prisma.item.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundError('Item not found');
    }
    try {
      const updated = await this.prisma.item.update({
        where: { id },
        data: dto,
        include: { _count: { select: ACTIVE_ENTRY_COUNT } },
      });
      await this.audit.record({
        userId: actor.id,
        entity: 'Item',
        entityId: id,
        action: 'UPDATE',
        before,
        after: this.stripCount(updated),
      });
      return this.toManaged(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('An item with this name already exists', {
          name: ['An item with this name already exists'],
        });
      }
      throw error;
    }
  }

  /**
   * Merges `sourceId` into `targetId`: repoints every entry (including
   * soft-deleted ones, to keep history intact) then deactivates the source.
   */
  async merge(
    sourceId: string,
    targetId: string,
    actor: AuthenticatedUser,
  ): Promise<MergeItemsResult> {
    if (sourceId === targetId) {
      throw new ValidationError('Cannot merge an item into itself');
    }
    const [source, target] = await Promise.all([
      this.prisma.item.findUnique({ where: { id: sourceId } }),
      this.prisma.item.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) {
      throw new NotFoundError('Item not found');
    }

    const movedCount = await this.prisma.$transaction(async (tx) => {
      const result = await tx.entry.updateMany({
        where: { itemId: sourceId },
        data: { itemId: targetId },
      });
      await tx.item.update({ where: { id: sourceId }, data: { isActive: false } });
      return result.count;
    });

    await this.audit.record({
      userId: actor.id,
      entity: 'Item',
      entityId: sourceId,
      action: 'MERGE',
      before: source,
      after: { mergedIntoItemId: targetId, movedCount },
    });
    return { movedCount };
  }

  private toItem(item: PrismaItem): Item {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    };
  }

  private toManaged(item: ItemWithUsage): ManagedItem {
    return { ...this.toItem(item), usageCount: item._count.entries };
  }

  private stripCount(item: ItemWithUsage): Record<string, unknown> {
    const { _count: _ignored, ...rest } = item;
    return rest;
  }
}
