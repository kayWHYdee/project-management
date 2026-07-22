import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createProjectRequestSchema,
  createSystemRequestSchema,
  projectStatusSchema,
  updateProjectRequestSchema,
  type CreateProjectRequest,
  type CreateSystemRequest,
  type Project,
  type ProjectDetail,
  type ProjectSummary,
  type System,
  type UpdateProjectRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { SystemsService } from '../systems/systems.service';
import { ProjectsService } from './projects.service';
import { ProjectSummaryService } from './project-summary.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly systems: SystemsService,
    private readonly summary: ProjectSummaryService,
  ) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ): Promise<Project[]> {
    const parsedStatus = status ? projectStatusSchema.safeParse(status) : undefined;
    return this.projects.list({
      status: parsedStatus?.success ? parsedStatus.data : undefined,
      clientId: clientId?.trim() || undefined,
      search: search?.trim() || undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<ProjectDetail> {
    return this.projects.getDetail(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string): Promise<ProjectSummary> {
    return this.summary.getSummary(id);
  }

  @Roles('OWNER', 'EDITOR')
  @Post()
  create(
    @Body(new ZodValidationPipe(createProjectRequestSchema)) dto: CreateProjectRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProjectDetail> {
    return this.projects.create(dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectRequestSchema)) dto: UpdateProjectRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProjectDetail> {
    return this.projects.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.projects.remove(id, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Post(':id/systems')
  addSystem(
    @Param('id') projectId: string,
    @Body(new ZodValidationPipe(createSystemRequestSchema)) dto: CreateSystemRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<System> {
    return this.systems.addToProject(projectId, dto, actor);
  }
}
