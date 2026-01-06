import { ZodSafeParseResult } from 'zod';
import { ApiError } from './api-error';
import { logger } from './logger';

const validateOrThrow = <T>(result: ZodSafeParseResult<T>, requestId: string): T => {
  if (result.success) {
    return result.data;
  }

  const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

  logger.debug(`RequestId: ${requestId}, Validation Error: ${errors}`);

  throw ApiError.badRequest(errors);
};

export { validateOrThrow };
