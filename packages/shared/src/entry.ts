import { z } from 'zod';
import { systemTypeSchema } from './enums';
import { moneySchema, quantitySchema } from './money';
import { isoDateSchema } from './date';

export const entrySchema = z.object({
  id: z.string(),
  systemId: z.string(),
  systemLabel: z.string(),
  systemType: systemTypeSchema,
  itemId: z.string().nullable(),
  itemName: z.string().nullable(),
  customName: z.string().nullable(),
  /** itemName ?? customName — what to show in a list. */
  displayName: z.string(),
  description: z.string().nullable(),
  quantity: z.string(),
  unit: z.string().nullable(),
  sentOn: z.string(),
  receivedBy: z.string().nullable(),
  rate: z.string().nullable(),
  amount: z.string().nullable(),
  notes: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
});
export type Entry = z.infer<typeof entrySchema>;

export const entryListSchema = z.array(entrySchema);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const createEntryRequestSchema = z
  .object({
    systemId: z.string().min(1, 'System is required'),
    itemId: z.string().optional(),
    customName: optionalText(200),
    description: optionalText(2000),
    quantity: quantitySchema,
    unit: optionalText(20),
    sentOn: isoDateSchema,
    receivedBy: optionalText(160),
    rate: moneySchema.nullable().optional(),
    amount: moneySchema.nullable().optional(),
    notes: optionalText(2000),
  })
  // Exactly one of itemId / customName (also a DB check constraint). customName is
  // only *permitted* for SPARES/CONSUMABLES — enforced in the service layer.
  .refine((data) => !!data.itemId !== !!data.customName, {
    message: 'Choose an item or enter a custom name (exactly one)',
    path: ['itemId'],
  });
export type CreateEntryRequest = z.infer<typeof createEntryRequestSchema>;

/**
 * Update never changes the item/customName identity (to change what was sent,
 * delete the row and add a new one — entries are records, not assets).
 * Guarded by optimistic locking via `version`.
 */
export const updateEntryRequestSchema = z
  .object({
    version: z.number().int().nonnegative(),
    description: optionalText(2000),
    quantity: quantitySchema.optional(),
    unit: optionalText(20),
    sentOn: isoDateSchema.optional(),
    receivedBy: optionalText(160),
    rate: moneySchema.nullable().optional(),
    amount: moneySchema.nullable().optional(),
    notes: optionalText(2000),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'version'), {
    message: 'Provide at least one field to update',
  });
export type UpdateEntryRequest = z.infer<typeof updateEntryRequestSchema>;
