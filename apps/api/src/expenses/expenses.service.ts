import { Injectable } from '@nestjs/common';
import { type Expense as PrismaExpense } from '@prisma/client';
import {
  isoDateToUtcDate,
  utcDateToIsoDate,
  type CreateExpenseRequest,
  type Expense,
  type UpdateExpenseRequest,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForProject(projectId: string): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ spentOn: 'desc' }, { createdAt: 'desc' }],
    });
    return expenses.map((expense) => this.toExpense(expense));
  }

  async create(
    projectId: string,
    dto: CreateExpenseRequest,
    actor: AuthenticatedUser,
  ): Promise<Expense> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    const created = await this.prisma.expense.create({
      data: {
        projectId,
        category: dto.category,
        amount: dto.amount,
        spentOn: isoDateToUtcDate(dto.spentOn),
        note: dto.note ?? null,
        createdById: actor.id,
      },
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Expense',
      entityId: created.id,
      action: 'CREATE',
      after: created,
    });
    return this.toExpense(created);
  }

  async update(id: string, dto: UpdateExpenseRequest, actor: AuthenticatedUser): Promise<Expense> {
    const before = await this.prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!before) {
      throw new NotFoundError('Expense not found');
    }
    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.spentOn !== undefined ? { spentOn: isoDateToUtcDate(dto.spentOn) } : {}),
        ...('note' in dto ? { note: dto.note ?? null } : {}),
      },
    });
    await this.audit.record({
      userId: actor.id,
      entity: 'Expense',
      entityId: id,
      action: 'UPDATE',
      before,
      after: updated,
    });
    return this.toExpense(updated);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const expense = await this.prisma.expense.findFirst({ where: { id, deletedAt: null } });
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId: actor.id,
      entity: 'Expense',
      entityId: id,
      action: 'DELETE',
      before: expense,
    });
  }

  private toExpense(expense: PrismaExpense): Expense {
    return {
      id: expense.id,
      projectId: expense.projectId,
      category: expense.category,
      amount: expense.amount.toFixed(2),
      spentOn: utcDateToIsoDate(expense.spentOn),
      note: expense.note,
      createdAt: expense.createdAt.toISOString(),
    };
  }
}
