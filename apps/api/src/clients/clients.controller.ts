import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createClientRequestSchema,
  updateClientRequestSchema,
  type Client,
  type CreateClientRequest,
  type UpdateClientRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Query('search') search?: string): Promise<Client[]> {
    return this.clients.list(search?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Client> {
    return this.clients.get(id);
  }

  @Roles('OWNER', 'EDITOR')
  @Post()
  create(
    @Body(new ZodValidationPipe(createClientRequestSchema)) dto: CreateClientRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Client> {
    return this.clients.create(dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClientRequestSchema)) dto: UpdateClientRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Client> {
    return this.clients.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.clients.remove(id, actor);
  }
}
