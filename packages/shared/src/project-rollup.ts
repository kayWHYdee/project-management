import { subtractMoney, sumMoney, sumQuantity } from './money';
import type { ItemCategory } from './enums';
import type { ItemRollup, ProjectFinancials } from './project-summary';

/** Minimal per-entry shape the rollups need. Pure — no DB or framework types. */
export interface RollupEntryInput {
  /** Stable grouping key: itemId, or `custom:<name>` for custom-named spares. */
  key: string;
  name: string;
  category: ItemCategory | null;
  quantity: string;
  amount: string | null;
}

/**
 * Rolls entries up per item: total quantity, total value, and count. All money
 * math goes through the shared decimal helpers — never a float. Sorted by name.
 */
export function buildItemRollups(entries: readonly RollupEntryInput[]): ItemRollup[] {
  const groups = new Map<
    string,
    {
      name: string;
      category: ItemCategory | null;
      quantities: string[];
      amounts: string[];
      count: number;
    }
  >();

  for (const entry of entries) {
    const group = groups.get(entry.key) ?? {
      name: entry.name,
      category: entry.category,
      quantities: [],
      amounts: [],
      count: 0,
    };
    group.quantities.push(entry.quantity);
    if (entry.amount !== null) {
      group.amounts.push(entry.amount);
    }
    group.count += 1;
    groups.set(entry.key, group);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      name: group.name,
      category: group.category,
      totalQuantity: sumQuantity(group.quantities),
      totalAmount: sumMoney(group.amounts),
      entryCount: group.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
}

/** Budget vs spent (materials + expenses), with remaining when a budget is set. */
export function buildFinancials(params: {
  budget: string | null;
  entryAmounts: readonly string[];
  expenseAmounts: readonly string[];
}): ProjectFinancials {
  const materialsAmount = sumMoney(params.entryAmounts);
  const expensesAmount = sumMoney(params.expenseAmounts);
  const totalSpent = sumMoney([materialsAmount, expensesAmount]);
  const remaining = params.budget !== null ? subtractMoney(params.budget, totalSpent) : null;
  return { budget: params.budget, materialsAmount, expensesAmount, totalSpent, remaining };
}
