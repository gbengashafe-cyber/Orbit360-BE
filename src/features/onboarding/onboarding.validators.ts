import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const createOnboardingSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  documentType: z.string().min(1, 'Document type is required'),
  documentName: z.string().min(1, 'Document name is required'),
  documentUrl: z.url('Invalid document URL').optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateOnboardingSchema = z.object({
  status: z.enum(['pending', 'submitted', 'approved', 'rejected'], { message: 'Invalid status' }),
  documentUrl: z.url('Invalid document URL').optional().nullable(),
  notes: z.string().optional().nullable(),
});

const onboardingIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Onboarding ID must be a number' })
    .transform(Number),
});

const employeeIdParamSchema = z.object({
  employeeId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Employee ID must be a number' })
    .transform(Number),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req[source]);
    next();
  };

const validateCreateOnboarding = validate(createOnboardingSchema, 'body');
const validateUpdateOnboarding = validate(updateOnboardingSchema, 'body');
const validateOnboardingIdParam = validate(onboardingIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');

export { validateCreateOnboarding, validateEmployeeIdParam, validateOnboardingIdParam, validateUpdateOnboarding };
