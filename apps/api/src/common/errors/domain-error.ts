/**
 * Typed domain errors. Services throw these; the global exception filter maps
 * them to HTTP responses. They carry an explicit status + stable error code so
 * nothing has to infer intent from a message string.
 */
export abstract class DomainError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly errorCode: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = new.target.name;
    this.fieldErrors = fieldErrors;
  }
}

export class ValidationError extends DomainError {
  readonly httpStatus = 400;
  readonly errorCode = 'VALIDATION';
}

export class UnauthorizedError extends DomainError {
  readonly httpStatus = 401;
  readonly errorCode = 'UNAUTHORIZED';
}

export class ForbiddenError extends DomainError {
  readonly httpStatus = 403;
  readonly errorCode = 'FORBIDDEN';
}

export class NotFoundError extends DomainError {
  readonly httpStatus = 404;
  readonly errorCode = 'NOT_FOUND';
}

export class ConflictError extends DomainError {
  readonly httpStatus = 409;
  readonly errorCode = 'CONFLICT';
}
