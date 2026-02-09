import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { userRoleOptions, userStatusOptions } from './user.model';

export const userSchema = z.object({
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
  role: z.enum(userRoleOptions),
  jobRole: z.string('User job role is required').min(1, 'User job role is required'),
  departmentName: z.string().min(1, 'User department is required'),
});

const UpdateUserSchema = userSchema.extend({ status: z.enum(userStatusOptions).optional() }).optional();

const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  let schema: z.ZodObject | z.ZodOptional;

  const isCreation = req.method === 'POST';

  if (isCreation) {
    schema = userSchema;
  } else {
    schema = UpdateUserSchema;
  }

  const result = schema.parse(req.body);

  req.validatedBody = { user: result };
  next();
};

export { validateUser };
