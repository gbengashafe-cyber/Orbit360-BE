import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const payrollReportSchema = z.object({
  name: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Report name is required' : 'Report name must be a string'),
    })
    .trim()
    .min(1, 'Report name cannot be empty'),

  payPeriod: z
    .string({
      error: (issue) => (issue.input === undefined ? 'Pay period is required' : 'Pay period must be a string'),
    })
    .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
});

const validatePayrollReport = (req: Request, res: Response, next: NextFunction) => {
  const result = payrollReportSchema.parse(req.body);

  req.body.validated = { payrollReport: result };
  next();
};

export { validatePayrollReport };
