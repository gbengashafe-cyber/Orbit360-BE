import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';

// Flexible date validation: accepts YYYY-MM-DD or ISO 8601 datetime
const flexibleDateValidation = z.string().refine(
  (date) => {
    // Accept YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return !isNaN(Date.parse(date));
    }
    // Accept ISO 8601 datetime format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
      return !isNaN(Date.parse(date));
    }
    return false;
  },
  { message: 'Invalid date format. Use YYYY-MM-DD or ISO 8601 (e.g., 2024-01-15 or 2024-01-15T14:00:00Z)' },
);

const createGoalSchema = z.object({
  employee_id: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  target_value: z.number().positive('Target value must be positive').optional(),
  start_date: flexibleDateValidation,
  end_date: flexibleDateValidation,
  assigned_by: z.string().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  target_value: z.number().positive('Target value must be positive').optional(),
  start_date: flexibleDateValidation.optional(),
  end_date: flexibleDateValidation.optional(),
});

const updateGoalProgressSchema = z.object({
  current_progress: z.number().min(0, 'Progress cannot be negative').optional(),
  completion_percentage: z
    .number()
    .min(0, 'Completion percentage cannot be negative')
    .max(100, 'Completion percentage cannot exceed 100')
    .optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed', 'on_hold'], { message: 'Invalid goal status' }).optional(),
});

const createAppraisalCycleSchema = z.object({
  cycle_name: z.string().min(3, 'Cycle name must be at least 3 characters').max(255, 'Cycle name must be at most 255 characters'),
  description: z.string().optional(),
  start_date: flexibleDateValidation,
  end_date: flexibleDateValidation,
  review_deadline: flexibleDateValidation,
  created_by: z.string().min(1, 'Created by is required').optional(),
  department: z.string().optional(),
});

const updateAppraisalCycleSchema = z.object({
  cycle_name: z
    .string()
    .min(3, 'Cycle name must be at least 3 characters')
    .max(255, 'Cycle name must be at most 255 characters')
    .optional(),
  description: z.string().optional(),
  start_date: flexibleDateValidation.optional(),
  end_date: flexibleDateValidation.optional(),
  review_deadline: flexibleDateValidation.optional(),
  department: z.string().optional(),
});

const submitAppraisalSchema = z.object({
  appraisal_cycle_id: z.number().int('Appraisal cycle ID must be an integer').min(1, 'Appraisal cycle ID is required'),
  employee_id: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  manager_id: z.number().int('Manager ID must be an integer').min(1, 'Manager ID is required'),
  performance_summary: z.string().min(10, 'Performance summary must be at least 10 characters').optional(),
  strengths: z.string().min(5, 'Strengths must be at least 5 characters').optional(),
  areas_for_improvement: z.string().min(5, 'Areas for improvement must be at least 5 characters').optional(),
});

const reviewAppraisalSchema = z.object({
  overall_rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  goals_achievement: z.number().min(0, 'Goals achievement cannot be negative').max(100, 'Goals achievement cannot exceed 100'),
});

const updateAppraisalSchema = z.object({
  performance_summary: z.string().min(10, 'Performance summary must be at least 10 characters').optional(),
  strengths: z.string().min(5, 'Strengths must be at least 5 characters').optional(),
  areas_for_improvement: z.string().min(5, 'Areas for improvement must be at least 5 characters').optional(),
});

const goalIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Goal ID must be a number' })
    .transform(Number),
});

const appraisalCycleIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Appraisal cycle ID must be a number' })
    .transform(Number),
});

const appraisalIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Appraisal ID must be a number' })
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

const validateCreateGoal = validate(createGoalSchema, 'body');
const validateUpdateGoal = validate(updateGoalSchema, 'body');
const validateUpdateGoalProgress = validate(updateGoalProgressSchema, 'body');
const validateGoalIdParam = validate(goalIdParamSchema, 'params');
const validateCreateAppraisalCycle = validate(createAppraisalCycleSchema, 'body');
const validateUpdateAppraisalCycle = validate(updateAppraisalCycleSchema, 'body');
const validateAppraisalCycleIdParam = validate(appraisalCycleIdParamSchema, 'params');
const validateSubmitAppraisal = validate(submitAppraisalSchema, 'body');
const validateReviewAppraisal = validate(reviewAppraisalSchema, 'body');
const validateUpdateAppraisal = validate(updateAppraisalSchema, 'body');
const validateAppraisalIdParam = validate(appraisalIdParamSchema, 'params');

export {
  validateCreateGoal,
  validateUpdateGoal,
  validateUpdateGoalProgress,
  validateGoalIdParam,
  validateCreateAppraisalCycle,
  validateUpdateAppraisalCycle,
  validateAppraisalCycleIdParam,
  validateSubmitAppraisal,
  validateReviewAppraisal,
  validateUpdateAppraisal,
  validateAppraisalIdParam,
};
