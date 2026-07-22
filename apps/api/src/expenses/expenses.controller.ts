import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  createExpenseRequestSchema,
  updateExpenseRequestSchema,
  type CreateExpenseRequest,
  type Expense,
  type UpdateExpenseRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { ExpensesService } from './expenses.service';

@Controller()
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get('projects/:projectId/expenses')
  listForProject(@Param('projectId') projectId: string): Promise<Expense[]> {
    return this.expenses.listForProject(projectId);
  }

  @Roles('OWNER', 'EDITOR')
  @Post('projects/:projectId/expenses')
  create(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createExpenseRequestSchema)) dto: CreateExpenseRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Expense> {
    return this.expenses.create(projectId, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch('expenses/:id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateExpenseRequestSchema)) dto: UpdateExpenseRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Expense> {
    return this.expenses.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete('expenses/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.expenses.remove(id, actor);
  }
}
