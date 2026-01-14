import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const createJobRoleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().optional().nullable(),
});

const updateJobRoleSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters').optional(),
    description: z.string().optional().nullable(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), { message: 'At least one property must be defined' });

type CreatePositionBody = z.infer<typeof createJobRoleSchema>;
type UpdatePositionBody = z.infer<typeof updateJobRoleSchema>;

const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  validateOrThrow(result, req.requestId);
  next();
};

const validateJobRolePosition = validate(createJobRoleSchema);
const validateUpdateJobRole = validate(updateJobRoleSchema);

export { validateJobRolePosition, validateUpdateJobRole };
