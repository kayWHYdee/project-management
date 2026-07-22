import { apiErrorSchema, type ApiError as ApiErrorBody } from '@water-pm/shared';
import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Thrown for any non-2xx response; carries the server's structured error. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.error;
    this.fieldErrors = body.fieldErrors;
  }
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Schema to validate the response against. Omit for empty (204) responses. */
  schema?: z.ZodType<T>;
}

async function request<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, schema } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204 || !schema) {
    return undefined as T;
  }
  return schema.parse(await response.json());
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());
    if (parsed.success) {
      return new ApiError(parsed.data);
    }
  } catch {
    // fall through to a generic error below
  }
  return new ApiError({
    statusCode: response.status,
    error: 'ERROR',
    message: `Request failed (${response.status})`,
  });
}

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>) => request(path, { schema }),
  post: <T>(path: string, body: unknown, schema?: z.ZodType<T>) =>
    request(path, { method: 'POST', body, schema }),
  patch: <T>(path: string, body: unknown, schema?: z.ZodType<T>) =>
    request(path, { method: 'PATCH', body, schema }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
