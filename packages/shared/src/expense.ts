import { z } from 'zod';
import { moneySchema } from './money';
import { isoDateSchema } from './date';

export const expenseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  category: z.string(),
  amount: z.string(),
  spentOn: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseListSchema = z.array(expenseSchema);

const optionalNote = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const createExpenseRequestSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(80),
  amount: moneySchema,
  spentOn: isoDateSchema,
  note: optionalNote,
});
export type CreateExpenseRequest = z.infer<typeof createExpenseRequestSchema>;

export const updateExpenseRequestSchema = z
  .object({
    category: z.string().trim().min(1).max(80).optional(),
    amount: moneySchema.optional(),
    spentOn: isoDateSchema.optional(),
    note: optionalNote,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequestSchema>;
