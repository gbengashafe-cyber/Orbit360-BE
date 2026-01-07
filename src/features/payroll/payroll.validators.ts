import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const createPayrollSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.number().int('Year must be an integer').min(1900, 'Year is invalid'), // Assuming a reasonable minimum year
  baseSalary: z.number().positive('Base salary must be a positive number'),
  allowances: z.number().min(0, 'Allowances cannot be negative').optional().default(0),
  deductions: z.number().min(0, 'Deductions cannot be negative').optional().default(0),
});

const updatePayrollSchema = z
  .object({
    baseSalary: z.number().positive('Base salary must be a positive number').optional(),
    allowances: z.number().min(0, 'Allowances cannot be negative').optional().default(0),
    deductions: z.number().min(0, 'Deductions cannot be negative').optional().default(0),
  })
  .partial(); // All fields are optional for update

const payrollIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Payroll ID must be a number' })
    .transform(Number),
});

const employeeIdParamSchema = z.object({
  employeeId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Employee ID must be a number' })
    .transform(Number),
});

type CreatePayrollBody = z.infer<typeof createPayrollSchema>;
type UpdatePayrollBody = z.infer<typeof updatePayrollSchema>;

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    validateOrThrow(result, req.requestId);

    req.body.validated = { payroll: result.data };
    next();
  };

const generatePayrollSchema = z.object({
  payPeriod: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
});

const validateGeneratePayroll = (req: Request, res: Response, next: NextFunction) => {
  const result = generatePayrollSchema.safeParse(req.body);

  validateOrThrow(result, req.requestId);

  req.body.validated = { payroll: result.data };
  next();
};

const validateCreatePayroll = validate(createPayrollSchema, 'body');
const validateUpdatePayroll = validate(updatePayrollSchema, 'body');
const validatePayrollIdParam = validate(payrollIdParamSchema, 'params');
const validateEmployeeIdParam = validate(employeeIdParamSchema, 'params');

export { validateCreatePayroll, validateEmployeeIdParam, validateGeneratePayroll, validatePayrollIdParam, validateUpdatePayroll };
