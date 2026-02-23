import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { LEAVE_TYPES } from './leave.model';

const createLeaveSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required').optional(),
  startDate: z
    .union([z.string().date('Invalid start date format'), z.string().datetime()])
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  endDate: z
    .union([z.string().date('Invalid end date format'), z.string().datetime()])
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  type: z.enum(LEAVE_TYPES as [string, ...string[]], {
    message: 'Invalid leave type',
  }),
  reason: z.string().optional().nullable(),
  leave_period: z.string().optional().nullable(),
  selected_supervisor_id: z.number().int().positive().optional().nullable(),
  covering_employee_id: z.number().int().positive().optional().nullable(),
  handover_notes: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  alternative_email: z.string().email().optional().nullable(),
});

const leaveIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Leave ID must be a number' })
    .transform(Number),
});

const employeeIdParamSchema = z.object({
  employeeId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Employee ID must be a number' })
    .transform(Number),
});

const approveDeclineSchema = z.object({
  action: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(['approved', 'rejected'], { message: "Action must be either 'approved' or 'rejected'" }),
  ),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req[source]);
    next();
  };

const validateCreateLeave = validate(createLeaveSchema, 'body');
const validateLeaveIdParam = validate(leaveIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');
const validateApproveDecline = validate(approveDeclineSchema, 'body');

export { validateApproveDecline, validateCreateLeave, validateEmployeeIdParam, validateLeaveIdParam };
