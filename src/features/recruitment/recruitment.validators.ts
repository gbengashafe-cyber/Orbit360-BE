import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const createJobPostingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary'], { message: 'Invalid employment type' }).optional(),
  salary_range_min: z.number().positive('Salary range minimum must be positive').optional(),
  salary_range_max: z.number().positive('Salary range maximum must be positive').optional(),
  requirements: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required'),
});

const updateJobPostingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  department: z.string().min(1, 'Department is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary'], { message: 'Invalid employment type' }).optional(),
  salary_range_min: z.number().positive('Salary range minimum must be positive').optional(),
  salary_range_max: z.number().positive('Salary range maximum must be positive').optional(),
  requirements: z.string().optional(),
});

const createJobApplicationSchema = z.object({
  job_posting_id: z.number().int('Job posting ID must be an integer').min(1, 'Job posting ID is required'),
  applicant_name: z.string().min(2, 'Applicant name must be at least 2 characters'),
  applicant_email: z.email('Invalid email format'),
  applicant_phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  resume_url: z.url('Invalid URL format').optional().nullable(),
  cover_letter: z.string().optional().nullable(),
  salary_expectation: z.number().positive('Salary expectation must be positive').optional().nullable(),
});

const updateApplicationStatusSchema = z.object({
  status: z
    .enum(['applied', 'under_review', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'], {
      message: 'Invalid status',
    })
    .optional(),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
});

const scheduleInterviewSchema = z.object({
  interview_date: z.iso.date('Invalid interview date format'),
  interview_notes: z.string().optional(),
});

export const jobPostingIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Job posting ID must be a number' })
    .transform(Number),
});

const jobApplicationIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Job application ID must be a number' })
    .transform(Number),
});

const jobPostingIdRouteParamSchema = z.object({
  jobPostingId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Job posting ID must be a number' })
    .transform(Number),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req[source]);
    next();
  };

const validateCreateJobPosting = validate(createJobPostingSchema, 'body');
const validateUpdateJobPosting = validate(updateJobPostingSchema, 'body');
const validateJobPostingIdParam = validate(jobPostingIdParamSchema, 'params');
const validateCreateJobApplication = validate(createJobApplicationSchema, 'body');
const validateUpdateApplicationStatus = validate(updateApplicationStatusSchema, 'body');
const validateScheduleInterview = validate(scheduleInterviewSchema, 'body');
const validateJobApplicationIdParam = validate(jobApplicationIdParamSchema, 'params');
const validateJobPostingIdRouteParam = validate(jobPostingIdRouteParamSchema, 'params');

export {
  validateCreateJobApplication,
  validateCreateJobPosting,
  validateJobApplicationIdParam,
  validateJobPostingIdParam,
  validateJobPostingIdRouteParam,
  validateScheduleInterview,
  validateUpdateApplicationStatus,
  validateUpdateJobPosting,
};
