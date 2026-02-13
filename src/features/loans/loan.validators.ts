import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { loanStatus } from './loan.model';

const loanSchema = z.object({
  employeeId: z.coerce.number('EmployeeID is required').int(),
  loanTypeId: z.coerce.number().int().positive(),
  principalAmount: z.coerce.number<number>().positive(),
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive(),
  startDate: z.iso.date(),
  notes: z.string().max(1000).optional(),
});

const updateLoanSchema = loanSchema.extend({
  status: z.enum(loanStatus),
});

const validateLoan = (req: Request, res: Response, next: NextFunction) => {
  let schema: z.ZodObject;
  if (req.method === 'POST') {
    schema = loanSchema;
  } else {
    schema = updateLoanSchema;
  }

  const result = schema.parse(req.body);

  req.body.validated = { loan: result };
  next();
};

export { validateLoan };
