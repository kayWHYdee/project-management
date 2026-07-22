import { z } from 'zod';
import { systemTypeSchema } from './enums';

export const systemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: systemTypeSchema,
  label: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type System = z.infer<typeof systemSchema>;

export const systemListSchema = z.array(systemSchema);

export const createSystemRequestSchema = z.object({
  type: systemTypeSchema,
  // Blank label defaults to a humanised type name in the service.
  label: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type CreateSystemRequest = z.infer<typeof createSystemRequestSchema>;

export const updateSystemRequestSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(120).optional(),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateSystemRequest = z.infer<typeof updateSystemRequestSchema>;
