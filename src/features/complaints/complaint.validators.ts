import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';

const createComplaintSchema = z.object({
  employee_id: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  complaint_type: z.enum(
    ['harassment', 'discrimination', 'safety', 'wage_dispute', 'working_conditions', 'other'],
    { message: 'Invalid complaint type' }
  ),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Invalid severity level' }).optional(),
  reported_to: z.string().optional().nullable(),
});

const updateComplaintSchema = z.object({
  complaint_type: z
    .enum(['harassment', 'discrimination', 'safety', 'wage_dispute', 'working_conditions', 'other'], {
      message: 'Invalid complaint type',
    })
    .optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  status: z.enum(['open', 'under_review', 'resolved', 'closed'], { message: 'Invalid status' }).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Invalid severity level' }).optional(),
  reported_to: z.string().optional().nullable(),
});

const resolveComplaintSchema = z.object({
  resolution_notes: z
    .string()
    .min(10, 'Resolution notes must be at least 10 characters')
    .max(1000, 'Resolution notes must be at most 1000 characters'),
});

const complaintIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Complaint ID must be a number' })
    .transform(Number),
});

const validate = (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error: any) {
      next(ApiError.badRequest(error.errors[0].message || 'Validation Error'));
    }
  };

const validateCreateComplaint = validate(createComplaintSchema, 'body');
const validateUpdateComplaint = validate(updateComplaintSchema, 'body');
const validateResolveComplaint = validate(resolveComplaintSchema, 'body');
const validateComplaintIdParam = validate(complaintIdParamSchema, 'params');

export { validateCreateComplaint, validateUpdateComplaint, validateResolveComplaint, validateComplaintIdParam };
