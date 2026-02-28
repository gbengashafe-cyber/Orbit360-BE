import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

const RoleSchema = z.object({
  name: z
    .string({
      error: (issue) => {
        if (issue.input === undefined) {
          return 'Role name is required';
        }
      },
    })
    .trim()
    .min(1, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be at most 50 characters'),
  description: z.string().max(100, 'Description should not exceed 100 characters').nullable().optional(),
});

const validateRole = async (req: Request, res: Response, next: NextFunction) => {
  const result = RoleSchema.parse(req.body);

  req.body.role = result;
  next();
};

export { validateRole };
