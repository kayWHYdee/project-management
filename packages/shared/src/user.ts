import { z } from 'zod';
import { roleSchema } from './enums';
import { emailSchema, passwordSchema } from './auth';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);

export const createUserRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/**
 * Partial update. At least one field must be present; the service enforces the
 * "cannot lock out the last OWNER" rule that a schema can't express.
 */
export const updateUserRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
