import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const createLeaveSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  startDate: z
    .union([z.string().date('Invalid start date format'), z.string().datetime()])
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  endDate: z
    .union([z.string().date('Invalid end date format'), z.string().datetime()])
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  type: z.enum(['sick', 'vacation', 'personal', 'maternity', 'paternity'], { message: 'Invalid leave type' }),
  reason: z.string().optional().nullable(),
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
  action: z.enum(['approved', 'rejected'], { message: "Action must be either 'approved' or 'rejected'" }),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    validateOrThrow(result, req.requestId);
    next();
  };

const validateCreateLeave = validate(createLeaveSchema, 'body');
const validateLeaveIdParam = validate(leaveIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');
const validateApproveDecline = validate(approveDeclineSchema, 'body');

export { validateApproveDecline, validateCreateLeave, validateEmployeeIdParam, validateLeaveIdParam };
