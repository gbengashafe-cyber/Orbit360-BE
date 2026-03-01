import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().optional().nullable(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  description: z.string().optional().nullable(),
});

const validate = (schema: z.ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.parse(req.body);

  req.body.validated = { company: result };
  next();
};

const validateCreateCompany = validate(createCompanySchema);
const validateUpdateCompany = validate(updateCompanySchema);

export { validateCreateCompany, validateUpdateCompany };
