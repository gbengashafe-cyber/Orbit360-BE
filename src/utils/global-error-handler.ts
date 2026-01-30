import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import {
  BaseError,
  ConnectionError,
  DatabaseError,
  EagerLoadingError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from './api-error';
import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction): Response => {
  logger.debug(err);

  if (['development', 'test'].includes(env.NODE_ENV)) {
    console.log('GLOBAL ERROR HANDLER:\n RequestID: ', req?.requestId, '\n', err);
  }

  enrichErrorWithRequestDetails(err, req);

  if (err instanceof BaseError) {
    err = handleSequelizeError(err);
  } else if (err instanceof ZodError) {
    err = handleZodError(err, req);
  } else if (err instanceof MulterError) {
    err = handleMulterError(err, req);
  } else if (!(err instanceof ApiError)) {
    err = handleUnknownError(err);
  }

  logger.error({ method: req?.method, path: req?.requestPath, requestId: req?.requestId, ...err });

  return res.status(err.code || 500).json({ success: false, message: err.message, data: {} });
};

function enrichErrorWithRequestDetails(err: any, req: Request): void {
  err.ip = req.requestIp;
  err.origin = req.headers.origin || 'undefined';
  err.referer = req.headers.referer || 'undefined';
}

function handleSequelizeError(err: BaseError): ApiError {
  let code: number = 400;
  let message = '';
  switch (err.constructor.name) {
    case UniqueConstraintError.name: {
      const uniqueErr = err as UniqueConstraintError;
      const fieldNames = Object.keys(uniqueErr.fields || {}).join(', ');
      code = 409;
      message = fieldNames ? `Duplicate record: The ${fieldNames} already exists.` : 'Duplicate record not allowed';
      break;
    }
    case ForeignKeyConstraintError.name:
      message = 'Missing/invalid association field.';
      break;
    case ValidationError.name:
      message = err.message ?? 'Oops! Looks like something is wrong with the request';
      break;
    case DatabaseError.name:
      message = 'Oops! Looks like something is wrong with the request';
      break;
    case EagerLoadingError.name:
      code = 500;
      message = 'Oops! Something went wrong. Please try again later';
      break;
    default:
      message = 'Oops! Something went wrong. Please try again later';
      break;
  }

  if (err instanceof ConnectionError) {
    return ApiError.internalServerError('Oops! Something went wrong on the server. Please try again later.');
  } else if (code === 409) {
    return ApiError.conflict(message);
  } else if (code === 500) {
    return ApiError.internalServerError(message);
  } else {
    return ApiError.badRequest(message);
  }
}

function handleZodError(err: ZodError, req: Request): ApiError {
  const errors = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

  logger.debug(`RequestId: ${req.requestId}, Validation Error: ${errors}`);
  return ApiError.badRequest(errors);
}

function handleMulterError(err: MulterError, req: Request): ApiError {
  let message = err.message;

  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File is too large. Please upload a smaller file.';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected field name. Please use "reportFile".';
  }

  logger.debug(`RequestId: ${req.requestId}, Multer Error: ${message}`);

  const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return new ApiError(statusCode, message);
}

function handleUnknownError(err: any): ApiError {
  logger.debug(err);
  const message = 'Oops! Something went wrong on the server. Please try again later';
  return ApiError.internalServerError(message);
}

export { globalErrorHandler };
