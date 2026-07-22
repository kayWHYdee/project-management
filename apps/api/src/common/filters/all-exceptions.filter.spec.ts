import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiError } from '@water-pm/shared';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../errors/domain-error';
import { AllExceptionsFilter } from './all-exceptions.filter';

function capture(exception: unknown): ApiError {
  const filter = new AllExceptionsFilter();
  vi.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
  let body: ApiError | undefined;
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn((payload: ApiError) => {
      body = payload;
    }),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, host);
  if (!body) throw new Error('filter did not respond');
  return body;
}

describe('AllExceptionsFilter', () => {
  it('maps a domain error to its status and code', () => {
    expect(capture(new NotFoundError('User not found'))).toEqual({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'User not found',
    });
  });

  it('includes field errors from a ValidationError', () => {
    const body = capture(new ValidationError('Validation failed', { email: ['taken'] }));
    expect(body.statusCode).toBe(400);
    expect(body.fieldErrors).toEqual({ email: ['taken'] });
  });

  it('maps a ZodError to a 400 with field errors', () => {
    const result = z.object({ email: z.string().email() }).safeParse({ email: 'nope' });
    const body = capture(result.success ? new Error('unexpected') : result.error);
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('VALIDATION');
    expect(body.fieldErrors?.email?.length).toBeGreaterThan(0);
  });

  it('maps a Nest HttpException', () => {
    const body = capture(new BadRequestException('bad input'));
    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('BAD_REQUEST');
  });

  it('maps a Prisma unique-violation to 409', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });
    expect(capture(prismaError).statusCode).toBe(409);
  });

  it('hides unexpected errors behind a generic 500', () => {
    expect(capture(new Error('leaky stack trace'))).toEqual({
      statusCode: 500,
      error: 'INTERNAL',
      message: 'Internal server error',
    });
  });
});
