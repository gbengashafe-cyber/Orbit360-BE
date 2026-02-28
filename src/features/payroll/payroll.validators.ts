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
  year: z.number().int('Year must be an integer').min(1900, 'Year is invalid'),
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
  .partial();

const payrollIdParamSchema = z.object({
  id: z
    .string()
    .refine((val) => !Number.isNaN(Number(val)), { message: 'Payroll ID must be a number' })
    .transform(Number),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.parse(req[source]);

    req.body._validated = { payroll: result };
    next();
  };

export const payPeriodRegex = /^20\d{2}-(0[1-9]|1[0-2])$/;

export const generatePayrollSchema = z.object({
  payPeriod: z.string().regex(payPeriodRegex, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
  companyId: z.coerce
    .number({
      error: (value) => {
        if (value.input === undefined) {
          return 'SBU code is required';
        }
      },
    })
    .int('SBU code is required')
    .positive('SBU code is not allowed'),
});

const updatePayrollStatusSchema = z.object({
  paymentDate: z.iso.date('Payment date is not valid'),
  status: z.enum(payrollStatus, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
});

const validateGeneratePayroll = (req: Request, res: Response, next: NextFunction) => {
  const result = generatePayrollSchema.parse(req.body);

  req.body._validated = { payroll: result };
  next();
};

const validatePayrollStatus = (req: Request, res: Response, next: NextFunction) => {
  const result = updatePayrollStatusSchema.parse(req.body);

  req.body.validated = { payroll: result };
  next();
};

const validateCreatePayroll = validate(createPayrollSchema, 'body');
const validateUpdatePayroll = validate(updatePayrollSchema, 'body');
const validatePayrollIdParam = validate(payrollIdParamSchema, 'params');

export { validateCreatePayroll, validateGeneratePayroll, validatePayrollIdParam, validatePayrollStatus, validateUpdatePayroll };
