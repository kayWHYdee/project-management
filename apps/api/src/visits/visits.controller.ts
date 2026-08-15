import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  createVisitRequestSchema,
  updateVisitRequestSchema,
  type CreateVisitRequest,
  type UpdateVisitRequest,
  type Visit,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { VisitsService } from './visits.service';

@Controller()
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get('projects/:projectId/visits')
  listForProject(@Param('projectId') projectId: string): Promise<Visit[]> {
    return this.visits.listForProject(projectId);
  }

  @Roles('OWNER', 'EDITOR')
  @Post('projects/:projectId/visits')
  create(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createVisitRequestSchema)) dto: CreateVisitRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Visit> {
    return this.visits.create(projectId, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch('visits/:id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVisitRequestSchema)) dto: UpdateVisitRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Visit> {
    return this.visits.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete('visits/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.visits.remove(id, actor);
  }
}
