import { z } from 'zod';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  projectCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type Client = z.infer<typeof clientSchema>;

export const clientListSchema = z.array(clientSchema);

export const createClientRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  contact: optionalTrimmed(160),
  phone: optionalTrimmed(40),
  email: optionalTrimmed(160),
  notes: optionalTrimmed(2000),
});
export type CreateClientRequest = z.infer<typeof createClientRequestSchema>;

export const updateClientRequestSchema = createClientRequestSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateClientRequest = z.infer<typeof updateClientRequestSchema>;
