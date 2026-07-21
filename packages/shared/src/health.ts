import { z } from 'zod';

/**
 * Phase 1 proof-of-wiring contract. Real feature contracts (auth, clients,
 * projects, entries, …) will be added alongside their modules in later phases,
 * always here so the shape cannot drift between client and server.
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('water-pm-api'),
  time: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
