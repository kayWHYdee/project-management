import { z } from 'zod';

/**
 * The single error shape every API endpoint returns on failure. The client
 * parses this instead of guessing; the server's exception filter is the only
 * thing that produces it. `fieldErrors` carries per-field validation messages
 * (keyed by field path) for form display.
 */
export const apiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
