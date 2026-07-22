import { Injectable } from '@nestjs/common';
import { Prisma, type Item as PrismaItem } from '@prisma/client';
import type { CreateItemRequest, Item } from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

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

  private toItem(item: PrismaItem): Item {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    };
  }
}
