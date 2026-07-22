import { z } from 'zod';
import { itemCategorySchema } from './enums';

/** One rolled-up row per item (or custom name) across a whole project. */
export const itemRollupSchema = z.object({
  /** itemId, or `custom:<name>` for custom-named spares. */
  key: z.string(),
  name: z.string(),
  category: itemCategorySchema.nullable(),
  totalQuantity: z.string(),
  totalAmount: z.string(),
  entryCount: z.number().int(),
});
export type ItemRollup = z.infer<typeof itemRollupSchema>;

export const projectFinancialsSchema = z.object({
  budget: z.string().nullable(),
  materialsAmount: z.string(),
  expensesAmount: z.string(),
  totalSpent: z.string(),
  remaining: z.string().nullable(),
});
export type ProjectFinancials = z.infer<typeof projectFinancialsSchema>;

export const projectSummarySchema = z.object({
  financials: projectFinancialsSchema,
  itemRollups: z.array(itemRollupSchema),
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
