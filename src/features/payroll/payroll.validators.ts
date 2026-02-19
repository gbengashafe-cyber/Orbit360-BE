import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { payrollStatus } from './payroll.model';

const createPayrollSchema = z.object({
  employee: z.number().int('Employee ID must be an integer'),
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.number().int('Year must be an integer').min(1900, 'Year is invalid'), // Assuming a reasonable minimum year
  baseSalary: z.number().positive('Base salary must be a positive number'),
  allowances: z.number().min(0, 'Allowances cannot be negative').optional(),
  deductions: z.number().min(0, 'Deductions cannot be negative').optional(),
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
    .refine((val) => !Number.isNaN(Number(val)), { message: 'Payroll ID must be a number' })
    .transform(Number),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    req.body.validated = { payroll: result.data };
    next();
  };

export const payPeriodRegex = /^20\d{2}-(0[1-9]|1[0-2])$/;

const generatePayrollSchema = z.object({
  payPeriod: z.string().regex(payPeriodRegex, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
});

const updatePayrollStatusSchema = z.object({
  paymentDate: z.iso.date('Payment date is not valid'),
  status: z.enum(payrollStatus, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
});

const validateGeneratePayroll = (req: Request, res: Response, next: NextFunction) => {
  const result = generatePayrollSchema.safeParse(req.body);

  req.body.validated = { payroll: result.data };
  next();
};

const validatePayrollStatus = (req: Request, res: Response, next: NextFunction) => {
  const result = updatePayrollStatusSchema.safeParse(req.body);

  req.body.validated = { payroll: result.data };
  next();
};

const validateCreatePayroll = validate(createPayrollSchema, 'body');
const validateUpdatePayroll = validate(updatePayrollSchema, 'body');
const validatePayrollIdParam = validate(payrollIdParamSchema, 'params');

export { validateCreatePayroll, validateGeneratePayroll, validatePayrollIdParam, validatePayrollStatus, validateUpdatePayroll };
