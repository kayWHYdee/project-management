import { type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors/domain-error';

/**
 * Validates and parses a request payload against a shared Zod schema. Used as
 * `@Body(new ZodValidationPipe(someSchema))` so the exact same schema guards the
 * server that the client's form uses.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        (fieldErrors[key] ??= []).push(issue.message);
      }
      throw new ValidationError('Validation failed', fieldErrors);
    }
    return result.data;
  }
}
