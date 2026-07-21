import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Minimal typed fetch helper. Every response is validated against a shared Zod
 * schema so the client can never assume a shape the server did not send.
 * Cookies are sent (credentials: 'include') for the session-based auth added in
 * Phase 2.
 */
export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return schema.parse(await response.json());
}
