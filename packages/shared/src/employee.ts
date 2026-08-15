import { z } from 'zod';
import { visitListSchema } from './visit';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  mobile: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  /** Number of (non-deleted) visits this employee has logged. */
  visitCount: z.number().int().nonnegative(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const employeeListSchema = z.array(employeeSchema);

/** Employee detail carries the projects they were sent to (their visits). */
export const employeeDetailSchema = employeeSchema.extend({
  visits: visitListSchema,
});
export type EmployeeDetail = z.infer<typeof employeeDetailSchema>;

export const createEmployeeRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  mobile: optionalTrimmed(40),
  // Blank role falls back to the DB default ("Technician").
  role: z.string().trim().min(1).max(80).optional(),
});
export type CreateEmployeeRequest = z.infer<typeof createEmployeeRequestSchema>;

/** Partial update guarded by optimistic locking via `version`. */
export const updateEmployeeRequestSchema = z
  .object({
    version: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(160).optional(),
    mobile: optionalTrimmed(40),
    role: z.string().trim().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'version'), {
    message: 'Provide at least one field to update',
  });
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeRequestSchema>;
