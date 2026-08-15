import { z } from 'zod';
import { photoReceivedSchema } from './enums';
import { decimalStringSchema } from './money';
import { isoDateSchema } from './date';

/** Hours worked on a visit: Decimal(5, 2), non-negative (half-hours allowed). */
export const hoursSchema = decimalStringSchema(3, 2).refine((v) => !v.trim().startsWith('-'), {
  message: 'Hours cannot be negative',
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

/**
 * A visit is the Employee↔Project join (the people equivalent of an Entry):
 * one employee at one project on one date. It carries both sides' display names
 * so a single row renders on the project page and the employee page alike.
 */
export const visitSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  systemId: z.string().nullable(),
  systemLabel: z.string().nullable(),
  purpose: z.string().nullable(),
  visitDate: z.string(),
  hours: z.string().nullable(),
  photoReceived: photoReceivedSchema,
  version: z.number().int(),
  createdAt: z.string().datetime(),
});
export type Visit = z.infer<typeof visitSchema>;

export const visitListSchema = z.array(visitSchema);

/** Create body; `projectId` comes from the URL, so it is not part of the payload. */
export const createVisitRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  systemId: z.string().optional(),
  purpose: optionalText(2000),
  visitDate: isoDateSchema,
  hours: hoursSchema.nullable().optional(),
  photoReceived: photoReceivedSchema.optional(),
});
export type CreateVisitRequest = z.infer<typeof createVisitRequestSchema>;

/** Partial update guarded by optimistic locking via `version`. */
export const updateVisitRequestSchema = z
  .object({
    version: z.number().int().nonnegative(),
    employeeId: z.string().min(1).optional(),
    systemId: z.string().nullable().optional(),
    purpose: optionalText(2000),
    visitDate: isoDateSchema.optional(),
    hours: hoursSchema.nullable().optional(),
    photoReceived: photoReceivedSchema.optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'version'), {
    message: 'Provide at least one field to update',
  });
export type UpdateVisitRequest = z.infer<typeof updateVisitRequestSchema>;
