import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  createEntryRequestSchema,
  updateEntryRequestSchema,
  type CreateEntryRequest,
  type Entry,
  type UpdateEntryRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { EntriesService } from './entries.service';

@Controller()
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Get('projects/:projectId/entries')
  listForProject(@Param('projectId') projectId: string): Promise<Entry[]> {
    return this.entries.listForProject(projectId);
  }

  @Roles('OWNER', 'EDITOR')
  @Post('entries')
  create(
    @Body(new ZodValidationPipe(createEntryRequestSchema)) dto: CreateEntryRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Entry> {
    return this.entries.create(dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch('entries/:id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEntryRequestSchema)) dto: UpdateEntryRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Entry> {
    return this.entries.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete('entries/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.entries.remove(id, actor);
  }
}
