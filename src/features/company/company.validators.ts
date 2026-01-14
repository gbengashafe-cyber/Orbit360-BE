import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().optional().nullable(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  description: z.string().optional().nullable(),
});

const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  validateOrThrow(result, req.requestId);
  req.body.validated = { company: result.data };
  next();
};

const validateCreateCompany = validate(createCompanySchema);
const validateUpdateCompany = validate(updateCompanySchema);

export { validateCreateCompany, validateUpdateCompany };
