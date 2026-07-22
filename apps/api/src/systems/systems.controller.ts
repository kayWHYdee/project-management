import { Body, Controller, Delete, HttpCode, Param, Patch } from '@nestjs/common';
import { updateSystemRequestSchema, type System, type UpdateSystemRequest } from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { SystemsService } from './systems.service';

@Roles('OWNER', 'EDITOR')
@Controller('systems')
export class SystemsController {
  constructor(private readonly systems: SystemsService) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSystemRequestSchema)) dto: UpdateSystemRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<System> {
    return this.systems.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.systems.remove(id, actor);
  }
}
