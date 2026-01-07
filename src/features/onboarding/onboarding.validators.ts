import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';

const createOnboardingSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  assignedTo: z.number().int('Assigned To must be an integer').optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateOnboardingSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'], { message: 'Invalid status' }),
  completionDate: z.string().datetime('Invalid completion date format').optional().nullable(),
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
    try {
      schema.parse(req[source]);
      next();
    } catch (error: any) {
      next(ApiError.badRequest(error.errors[0].message || 'Validation Error'));
    }
  };

const validateCreateOnboarding = validate(createOnboardingSchema, 'body');
const validateUpdateOnboarding = validate(updateOnboardingSchema, 'body');
const validateOnboardingIdParam = validate(onboardingIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');

export {
  validateCreateOnboarding,
  validateUpdateOnboarding,
  validateOnboardingIdParam,
  validateEmployeeIdParam,
};
