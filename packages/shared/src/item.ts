import { z } from 'zod';
import { itemCategorySchema } from './enums';

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: itemCategorySchema,
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type Item = z.infer<typeof itemSchema>;

export const itemListSchema = z.array(itemSchema);

export const createItemRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  category: itemCategorySchema.optional(),
});
export type CreateItemRequest = z.infer<typeof createItemRequestSchema>;
