import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().optional().nullable(),
  companyId: z.number().int('Company ID must be an integer').min(1, 'Company ID is required'),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  description: z.string().optional().nullable(),
});

const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.parse(req.body);

  req.body.validated = { department: result };
  next();
};

const validateCreateDepartment = validate(createDepartmentSchema);
const validateUpdateDepartment = validate(updateDepartmentSchema);

export { validateCreateDepartment, validateUpdateDepartment };
