import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const createExitSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).transform(String),
  employeeName: z.string().optional(),
  employeeEmail: z.string().email().optional(),
  employeeDepartment: z.string().optional(),
  position: z.string().optional(),
  resignationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid resignation date format' }),
  lastWorkingDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid last working date format' }),
  noticePeriod: z.number().int().optional(),
  status: z.enum(['submitted', 'under_review', 'clearance_pending', 'approved', 'completed', 'rejected', 'withdrawn']).optional(),
  employeeSignatureDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid employee signature date format' })
    .optional(),
  handoverStatus: z.enum(['in_progress', 'yes', 'no']).optional(),
  handoverDetails: z.string().optional(),
  handoverRecipientName: z.string().optional(),
  handoverRecipientContact: z.string().optional(),
  outstandingTasks: z.string().optional(),
  outstandingApprovals: z.string().optional(),
  assetsToReturn: z.string().optional(),
  assetReturnStatus: z.enum(['not_applicable', 'pending_return', 'returned', 'not_returned']).optional(),
  salaryBalanceNotes: z.string().optional(),
  loanDeductionNotes: z.string().optional(),
  leaveEncashmentRequest: z.boolean().optional(),
  pensionProcessingNotes: z.string().optional(),
  overallExperienceRating: z.number().int().min(1).max(5).optional(),
  positiveExperience: z.string().optional(),
  areasForImprovementOrg: z.string().optional(),
  wouldRecommendOrg: z.boolean().optional(),
  itAdminClearance: z.boolean().optional(),
  supervisorClearance: z.boolean().optional(),
  financeClearance: z.boolean().optional(),
  hrClearance: z.boolean().optional(),
});

const exitIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Exit ID must be a valid UUID' }),
});

const employeeIdParamSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

const approveExitSchema = z.object({
  action: z.enum(['approved', 'rejected'], { message: 'Action must be either "approved" or "rejected"' }),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req[source]);
    next();
  };

const validateCreateExit = validate(createExitSchema, 'body');
const validateExitIdParam = validate(exitIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');
const validateApproveExit = validate(approveExitSchema, 'body');

export { validateApproveExit, validateCreateExit, validateEmployeeIdParam, validateExitIdParam };
