import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiError } from '@water-pm/shared';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../errors/domain-error';

/**
 * The single place that turns any thrown error into an HTTP response. It never
 * leaks stack traces or raw Prisma errors to the client; unexpected errors are
 * logged server-side and returned as a generic 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toApiError(exception);

    if (body.statusCode >= 500) {
      this.logger.error(
        `Unhandled ${body.statusCode}: ${this.describe(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.httpStatus,
        error: exception.errorCode,
        message: exception.message,
        ...(exception.fieldErrors ? { fieldErrors: exception.fieldErrors } : {}),
      };
    }

    if (exception instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of exception.issues) {
        const key = issue.path.join('.') || '_';
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { statusCode: 400, error: 'VALIDATION', message: 'Validation failed', fieldErrors };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        error: this.httpErrorCode(status),
        message: exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    return { statusCode: 500, error: 'INTERNAL', message: 'Internal server error' };
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): ApiError {
    switch (error.code) {
      case 'P2002':
        return { statusCode: 409, error: 'CONFLICT', message: 'That value is already in use' };
      case 'P2025':
        return { statusCode: 404, error: 'NOT_FOUND', message: 'Resource not found' };
      default:
        // Any other DB error is unexpected — log detail, return generic.
        this.logger.error(`Prisma ${error.code}: ${error.message}`);
        return { statusCode: 500, error: 'INTERNAL', message: 'Internal server error' };
    }
  }

  private httpErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'ERROR';
  }

  private describe(exception: unknown): string {
    if (exception instanceof Error) return `${exception.name}: ${exception.message}`;
    return String(exception);
  }
}
