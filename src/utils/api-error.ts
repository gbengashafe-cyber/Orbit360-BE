export const HttpStatus = {
  MaskedError: 200,
  BadRequest: 400,
  NotFound: 404,
  Unauthenticated: 401,
  Forbidden: 403,
  TooManyRequests: 429,
  Conflict: 409,
  ValidationError: 422,
  InternalServerError: 500,
  NotImplemented: 501,
} as const;

class ApiError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);

    this.name = 'ApiError';
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static maskedError(message: string): ApiError {
    return new ApiError(HttpStatus.MaskedError, message);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(HttpStatus.BadRequest, message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(HttpStatus.NotFound, message);
  }

  static unauthenticated(message: string): ApiError {
    return new ApiError(HttpStatus.Unauthenticated, message);
  }

  static forbidden(message: string): ApiError {
    return new ApiError(HttpStatus.Forbidden, message);
  }

  static tooManyRequests(message: string): ApiError {
    return new ApiError(HttpStatus.TooManyRequests, message);
  }
  static conflict(message: string): ApiError {
    return new ApiError(HttpStatus.Conflict, message);
  }
  static validationError(message: string): ApiError {
    return new ApiError(HttpStatus.ValidationError, message);
  }

  static internalServerError(message: string): ApiError {
    return new ApiError(HttpStatus.InternalServerError, message);
  }

  static notImplemented(message: string): ApiError {
    return new ApiError(HttpStatus.NotImplemented, message);
  }
}

export { ApiError };
