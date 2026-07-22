import { Module } from '@nestjs/common';
import { SystemsModule } from '../systems/systems.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectSummaryService } from './project-summary.service';

@Module({
  imports: [SystemsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectSummaryService],
})
export class ProjectsModule {}
