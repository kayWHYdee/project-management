import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateEmployeeRequest,
  Employee,
  EmployeeDetail,
  UpdateEmployeeRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { mapVisit } from '../visits/visit.mapper';

const withVisitIds = {
  visits: { where: { deletedAt: null }, select: { id: true } },
} satisfies Prisma.EmployeeInclude;

const withVisitDetails = {
  visits: {
    where: { deletedAt: null },
    include: { project: true, employee: true, system: true },
    orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
  },
} satisfies Prisma.EmployeeInclude;

type EmployeeCountRow = Prisma.EmployeeGetPayload<{ include: typeof withVisitIds }>;
type EmployeeDetailRow = Prisma.EmployeeGetPayload<{ include: typeof withVisitDetails }>;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(search?: string): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: withVisitIds,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return employees.map((employee) => this.toEmployee(employee, employee.visits.length));
  }

  async get(id: string): Promise<EmployeeDetail> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: withVisitDetails,
    });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    return this.toEmployeeDetail(employee);
  }

  async create(dto: CreateEmployeeRequest, actor: AuthenticatedUser): Promise<Employee> {
    const created = await this.prisma.employee.create({
      data: {
        name: dto.name,
        mobile: dto.mobile ?? null,
        ...(dto.role ? { role: dto.role } : {}),
      },
      include: withVisitIds,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Employee',
      entityId: created.id,
      action: 'CREATE',
      after: this.stripVisits(created),
    });
    return this.toEmployee(created, 0);
  }

  async update(
    id: string,
    dto: UpdateEmployeeRequest,
    actor: AuthenticatedUser,
  ): Promise<Employee> {
    const before = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: withVisitIds,
    });
    if (!before) {
      throw new NotFoundError('Employee not found');
    }

    const data = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.mobile !== undefined ? { mobile: dto.mobile } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      version: { increment: 1 },
    };

    const result = await this.prisma.employee.updateMany({
      where: { id, deletedAt: null, version: dto.version },
      data,
    });
    if (result.count === 0) {
      throw new ConflictError(
        'This employee changed while you were editing. Reload and try again.',
      );
    }

    const after = await this.prisma.employee.findUniqueOrThrow({
      where: { id },
      include: withVisitIds,
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Employee',
      entityId: id,
      action: 'UPDATE',
      before: this.stripVisits(before),
      after: this.stripVisits(after),
    });
    return this.toEmployee(after, after.visits.length);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id, deletedAt: null } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    await this.prisma.employee.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Employee',
      entityId: id,
      action: 'DELETE',
      before: employee,
    });
  }

  private toEmployee(employee: EmployeeCountRow | EmployeeDetailRow, visitCount: number): Employee {
    return {
      id: employee.id,
      name: employee.name,
      mobile: employee.mobile,
      role: employee.role,
      isActive: employee.isActive,
      visitCount,
      version: employee.version,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  private toEmployeeDetail(employee: EmployeeDetailRow): EmployeeDetail {
    return {
      ...this.toEmployee(employee, employee.visits.length),
      visits: employee.visits.map(mapVisit),
    };
  }

  private stripVisits(employee: EmployeeCountRow): Record<string, unknown> {
    const { visits: _visits, ...rest } = employee;
    return rest;
  }
}
