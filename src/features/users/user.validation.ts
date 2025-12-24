import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { userStatusOptions } from './user.model';

const UpdateUserSchema = z.object({ status: z.enum(userStatusOptions) });

const UserSchema = z.object({
  email: z
    .email({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'Email address is required';
        }
      },
    })
    .max(100, 'Only 100 characters are allowed for user email address'),
  firstName: z
    .string({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'First name is required';
        }
      },
    })
    .trim()
    .min(1, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'Last name is required';
        }
      },
    })
    .trim()
    .min(1, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  profileImage: z.string().nullable().optional(),
  googleId: z.string().nullable().optional(),
  employeeId: z
    .string({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'Employee ID is required';
        }
      },
    })
    .min(1, 'Employee ID is required'),
  position: z
    .string({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'User position is required';
        }
      },
    })
    .min(1, 'User position is required'),
  department: z
    .string({
      error: (issue) => {
        if (typeof issue.input !== 'string') {
          return 'User department is required';
        }
      },
    })
    .min(1, 'User department is required'),
});

const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  let schema: z.ZodObject;

  if (req.method === 'POST') {
    schema = UserSchema;
  } else {
    schema = Object.assign({}, UserSchema, UpdateUserSchema);
  }

  const result = schema.safeParse(req.body);

  if (!result.success) {
    logger.debug(`RequestId: ${req.requestId}, Error: ${result.error}`);
    const errors = result.error.issues.map((_error) => _error.message).join(', ');
    throw ApiError.badRequest(errors);
  }

  req.body.user = result.data;
  next();
};

export { validateUser };
