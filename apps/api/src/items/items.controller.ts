import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createItemRequestSchema,
  mergeItemsRequestSchema,
  updateItemRequestSchema,
  type CreateItemRequest,
  type Item,
  type ManagedItem,
  type MergeItemsRequest,
  type MergeItemsResult,
  type UpdateItemRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(@Query('includeInactive') includeInactive?: string): Promise<Item[]> {
    return this.items.list(includeInactive === 'true');
  }

  @Get('managed')
  listManaged(): Promise<ManagedItem[]> {
    return this.items.listManaged();
  }

  // Any role except VIEWER may add an item (inline "add new item").
  @Roles('OWNER', 'EDITOR')
  @Post()
  create(
    @Body(new ZodValidationPipe(createItemRequestSchema)) dto: CreateItemRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Item> {
    return this.items.create(dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateItemRequestSchema)) dto: UpdateItemRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ManagedItem> {
    return this.items.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Post(':id/merge')
  merge(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mergeItemsRequestSchema)) dto: MergeItemsRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MergeItemsResult> {
    return this.items.merge(id, dto.targetItemId, actor);
  }
}
