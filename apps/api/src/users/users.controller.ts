import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createUserRequestSchema,
  updateUserRequestSchema,
  type CreateUserRequest,
  type UpdateUserRequest,
  type User,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { UsersService } from './users.service';

@Roles('OWNER')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(): Promise<User[]> {
    return this.users.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createUserRequestSchema)) dto: CreateUserRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<User> {
    return this.users.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserRequestSchema)) dto: UpdateUserRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<User> {
    return this.users.update(id, dto, actor);
  }
}
