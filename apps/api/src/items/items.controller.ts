import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { createItemRequestSchema, type CreateItemRequest, type Item } from '@water-pm/shared';
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

  // Any role except VIEWER may add an item (inline "add new item").
  @Roles('OWNER', 'EDITOR')
  @Post()
  create(
    @Body(new ZodValidationPipe(createItemRequestSchema)) dto: CreateItemRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Item> {
    return this.items.create(dto, actor);
  }
}
