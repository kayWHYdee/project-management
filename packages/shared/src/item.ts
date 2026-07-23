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

/** Item plus how many entries reference it — for Settings → Items. */
export const managedItemSchema = itemSchema.extend({
  usageCount: z.number().int().nonnegative(),
});
export type ManagedItem = z.infer<typeof managedItemSchema>;

export const managedItemListSchema = z.array(managedItemSchema);

/** Rename / recategorise / (de)activate. Renaming happens only here, never inline. */
export const updateItemRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(160).optional(),
    category: itemCategorySchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;

export const mergeItemsRequestSchema = z.object({
  targetItemId: z.string().min(1, 'Choose an item to merge into'),
});
export type MergeItemsRequest = z.infer<typeof mergeItemsRequestSchema>;

export const mergeItemsResultSchema = z.object({
  movedCount: z.number().int().nonnegative(),
});
export type MergeItemsResult = z.infer<typeof mergeItemsResultSchema>;
