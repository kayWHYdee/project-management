import { Injectable } from '@nestjs/common';
import {
  buildFinancials,
  buildItemRollups,
  type ProjectSummary,
  type RollupEntryInput,
} from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from '../common/errors/domain-error';

@Injectable()
export class ProjectSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(projectId: string): Promise<ProjectSummary> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const entries = await this.prisma.entry.findMany({
      where: { deletedAt: null, system: { projectId, deletedAt: null } },
      include: { item: true },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { projectId, deletedAt: null },
    });

    const budget = project.budgetValue ? project.budgetValue.toFixed(2) : null;
    const financials = buildFinancials({
      budget,
      entryAmounts: entries.filter((e) => e.amount !== null).map((e) => e.amount!.toFixed(2)),
      expenseAmounts: expenses.map((x) => x.amount.toFixed(2)),
    });

    const rollupInputs: RollupEntryInput[] = entries.map((entry) => ({
      key: entry.itemId ?? `custom:${entry.customName ?? ''}`,
      name: entry.item?.name ?? entry.customName ?? '(unnamed)',
      category: entry.item?.category ?? null,
      quantity: entry.quantity.toFixed(3),
      amount: entry.amount ? entry.amount.toFixed(2) : null,
    }));

    return { financials, itemRollups: buildItemRollups(rollupInputs) };
  }
}
