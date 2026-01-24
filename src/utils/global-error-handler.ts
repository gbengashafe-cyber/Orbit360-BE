import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import {
  BaseError,
  ConnectionError,
  DatabaseError,
  EagerLoadingError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { env } from '../config/env';
import { ApiError } from './api-error';
import { logger } from './logger';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction): Response => {
  logger.debug(err);

  if (['development', 'test'].includes(env.NODE_ENV)) {
    console.log('GLOBAL ERROR HANDLER:\n RequestID: ', req?.requestId, '\n', err);
  }

  err.ip = req.requestIp;
  err.origin = req.headers.origin || 'undefined';
  err.referer = req.headers.referer || 'undefined';

  if (err instanceof BaseError) {
    let code: number = 400;
    let message = '';
    switch (err.constructor.name) {
      case UniqueConstraintError.name:
        code = 409;
        message = err.entity
          ? 'Duplicate record not allowed for entity ' + err.entity?.toLowerCase()
          : 'Duplicate record not allowed';
        break;
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
      logger.error('Unable to connect to DB.');
      err = ApiError.internalServerError('Oops! Something went wrong on the server. Please try again later.');
    } else if (code === 409) {
      err = ApiError.conflict(message);
    } else if (code === 500) {
      err = ApiError.internalServerError(message);
    } else {
      err = ApiError.badRequest(message);
    }
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

    logger.debug(`RequestId: ${req.requestId}, Validation Error: ${errors}`);

    err = ApiError.badRequest(errors);
  }

  if (err instanceof MulterError) {
    let message = err.message;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Please upload a smaller file.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected field name. Please use "reportFile".';
    }

    logger.debug(`RequestId: ${req.requestId}, Multer Error: ${message}`);

    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    err = new ApiError(statusCode, message);
  }

  if (!(err instanceof ApiError)) {
    const message = err.message || 'Oops! Something went wrong on the server. Please try again later';
    err = ApiError.internalServerError(message);
  }

  logger.error({ method: req?.method, path: req?.requestPath, requestId: req?.requestId, ...err });

  return res.status(err.code || 500).json({ success: false, message: err.message, data: {} });
};

export { globalErrorHandler };
