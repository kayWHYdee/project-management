import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createEmployeeRequestSchema,
  updateEmployeeRequestSchema,
  type CreateEmployeeRequest,
  type Employee,
  type EmployeeDetail,
  type UpdateEmployeeRequest,
} from '@water-pm/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(@Query('search') search?: string): Promise<Employee[]> {
    return this.employees.list(search);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<EmployeeDetail> {
    return this.employees.get(id);
  }

  @Roles('OWNER', 'EDITOR')
  @Post()
  create(
    @Body(new ZodValidationPipe(createEmployeeRequestSchema)) dto: CreateEmployeeRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Employee> {
    return this.employees.create(dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEmployeeRequestSchema)) dto: UpdateEmployeeRequest,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<Employee> {
    return this.employees.update(id, dto, actor);
  }

  @Roles('OWNER', 'EDITOR')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.employees.remove(id, actor);
  }
}
