import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const createExitSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  exitType: z.enum(['resignation', 'termination', 'retirement', 'contract_end'], { message: 'Invalid exit type' }),
  exitDate: z.iso.date('Invalid exit date format'),
  reason: z.string().optional().nullable(),
});

const exitIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Exit ID must be a number' })
    .transform(Number),
});

const employeeIdParamSchema = z.object({
  employeeId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Employee ID must be a number' })
    .transform(Number),
});

const approveExitSchema = z.object({
  action: z.enum(['approved', 'rejected'], { message: 'Action must be either "approved" or "rejected"' }),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    validateOrThrow(result, req.requestId);
    next();
  };

const validateCreateExit = validate(createExitSchema, 'body');
const validateExitIdParam = validate(exitIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');
const validateApproveExit = validate(approveExitSchema, 'body');

export { validateApproveExit, validateCreateExit, validateEmployeeIdParam, validateExitIdParam };
