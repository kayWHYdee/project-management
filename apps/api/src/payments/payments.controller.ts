import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  createPaymentRequestSchema,
  type CreatePaymentRequest,
  type Payment,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('projects/:projectId/payments')
  listForProject(@Param('projectId') projectId: string): Promise<Payment[]> {
    return this.payments.listForProject(projectId);
  }

  @Roles('OWNER', 'EDITOR')
  @Post('projects/:projectId/payments')
  create(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createPaymentRequestSchema)) dto: CreatePaymentRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Payment> {
    return this.payments.create(projectId, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete('payments/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.payments.remove(id, actor);
  }
}
