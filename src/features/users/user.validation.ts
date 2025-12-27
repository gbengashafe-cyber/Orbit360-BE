import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { userStatusOptions } from './user.model';

const userSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.email().max(100, 'Only 100 characters are allowed for user email address'),
  profileImage: z.string().nullable().optional(),
  googleId: z.string().nullable().optional(),
  position: z.string().min(1, 'User position is required'),
  department: z.string().min(1, 'User department is required'),
});

const UpdateUserSchema = userSchema.extend({ status: z.enum(userStatusOptions) });

const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  let schema: z.ZodObject;

  const isCreation = req.method === 'POST';

  if (isCreation) {
    schema = userSchema;
  } else {
    schema = UpdateUserSchema;
  }

  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((_error) => `${_error.path}: ${_error.message}`).join(', ');
    logger.debug(`RequestId: ${req.requestId}, Validation Error: ${errors}`);
    throw ApiError.badRequest(errors);
  }

  req.body.user = result.data;
  next();
};

export { validateUser };
