import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const createJobRoleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  departmentId: z.coerce.number('the department must be specified'),
  description: z.string().optional().nullable(),
});

const updateJobRoleSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters').optional(),
    description: z.string().optional().nullable(),
  })
  .refine((data) => Object.values(data).some((val) => val != undefined), { message: 'At least one property must be defined' });

const createJobRolePermissionSchema = z.array(z.string('Permission name is required'));

const validate = (schema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.parse(req.body);

    req.body.validated = { jobRole: result };
    next();
  };
};

const validateJobRole = validate(createJobRoleSchema);
const validateUpdateJobRole = validate(updateJobRoleSchema);

const validateJobRolePermissions = (req: Request, res: Response, next: NextFunction) => {
  const result = createJobRolePermissionSchema.parse(req.body);

  req.validatedBody = { jobRolePermissions: result };
  next();
};

export { validateJobRole, validateJobRolePermissions, validateUpdateJobRole };
