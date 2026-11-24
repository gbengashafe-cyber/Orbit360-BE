import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { COMPLAINT_STATUS, COMPLAINT_TYPES, COMPLAINT_URGENCY } from './complaint.model';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

// Unknown keys (including any employee_id / employeeId) are stripped: ownership always comes from the session.
const createComplaintSchema = z.object({
  complaintType: z.enum(COMPLAINT_TYPES, { message: 'Select a valid complaint type' }),
  severity: z.enum(COMPLAINT_URGENCY, { message: 'Select a valid urgency level' }).default('medium'),
  title: z
    .string({ message: 'Subject is required' })
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject must be at most 255 characters'),
  description: z
    .string({ message: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  incidentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Incident date must be a valid date')
    .refine((value) => value <= todayIsoDate(), 'Incident date cannot be in the future')
    .nullable()
    .optional(),
  witnesses: z.string().trim().max(1000, 'Witnesses must be at most 1000 characters').nullable().optional(),
  isAnonymous: z.boolean().default(false),
});

const reviewComplaintSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT'], { message: 'Decision must be APPROVE or REJECT' }),
    note: z.string().trim().max(1000, 'Note must be at most 1000 characters').optional(),
  })
  .refine((value) => value.decision !== 'REJECT' || !!value.note, {
    message: 'A reason is required when rejecting',
    path: ['note'],
  });

const approveComplaintSchema = z.object({
  note: z.string().trim().max(1000, 'Note must be at most 1000 characters').optional(),
});

const rejectComplaintSchema = z.object({
  note: z
    .string({ message: 'A reason is required when rejecting' })
    .trim()
    .min(1, 'A reason is required when rejecting')
    .max(1000, 'Note must be at most 1000 characters'),
});

const complaintIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Complaint ID must be a positive number'),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in YYYY-MM-DD format');

const listComplaintsQuerySchema = z
  .object({
    status: z.enum(COMPLAINT_STATUS).optional(),
    severity: z.enum(COMPLAINT_URGENCY).optional(),
    search: z.string().trim().max(100, 'Search must be at most 100 characters').optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
  })
  .refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: 'Start date must be on or before end date',
    path: ['dateFrom'],
  });

const validateBody = (schema: z.ZodType) => (req: Request, _res: Response, next: NextFunction) => {
  req.validatedBody = schema.parse(req.body ?? {}) as Record<string, any>;
  next();
};

const validateComplaintIdParam = (req: Request, _res: Response, next: NextFunction) => {
  complaintIdParamSchema.parse(req.params);
  next();
};

const validateListComplaintsQuery = (req: Request, _res: Response, next: NextFunction) => {
  const query = req.query as Record<string, unknown>;
  listComplaintsQuerySchema.parse({
    status: query.status || undefined,
    severity: query.severity || undefined,
    search: query.search || undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
  });
  next();
};

const validateCreateComplaint = validateBody(createComplaintSchema);
const validateReviewComplaint = validateBody(reviewComplaintSchema);
const validateApproveComplaint = validateBody(approveComplaintSchema);
const validateRejectComplaint = validateBody(rejectComplaintSchema);

export {
  validateApproveComplaint,
  validateComplaintIdParam,
  validateCreateComplaint,
  validateListComplaintsQuery,
  validateRejectComplaint,
  validateReviewComplaint,
};
