import { z } from 'zod';
import { projectStatusSchema } from './enums';
import { moneySchema } from './money';
import { isoDateSchema } from './date';
import { systemListSchema } from './system';

export const projectSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  name: z.string(),
  status: projectStatusSchema,
  address: z.string().nullable(),
  description: z.string().nullable(),
  budgetValue: z.string().nullable(),
  startDate: z.string().nullable(),
  notes: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const projectListSchema = z.array(projectSchema);

/** Project detail also carries its systems (Spares/Consumables always present). */
export const projectDetailSchema = projectSchema.extend({
  systems: systemListSchema,
});
export type ProjectDetail = z.infer<typeof projectDetailSchema>;

const optionalMoney = moneySchema.nullable().optional();
const optionalDate = isoDateSchema.nullable().optional();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const createProjectRequestSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  status: projectStatusSchema.optional(),
  address: optionalText(400),
  description: optionalText(4000),
  budgetValue: optionalMoney,
  startDate: optionalDate,
  notes: optionalText(4000),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

/**
 * Partial update guarded by optimistic locking: `version` is the value the
 * client last saw. The server rejects a mismatch with 409.
 */
export const updateProjectRequestSchema = z
  .object({
    version: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(200).optional(),
    status: projectStatusSchema.optional(),
    address: optionalText(400),
    description: optionalText(4000),
    budgetValue: optionalMoney,
    startDate: optionalDate,
    notes: optionalText(4000),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'version'), {
    message: 'Provide at least one field to update',
  });
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
