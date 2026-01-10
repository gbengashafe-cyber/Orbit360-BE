import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';
import { loanStatus, loanType } from './loan.model';

const loanSchema = z.object({
  employeeId: z.coerce.number('EmployeeID is required').int(),
  loanType: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.toUpperCase();
      }
      return val;
    },
    z.enum(loanType, { error: `Allowed loan types are ${loanType.join(', ')}` }),
  ),
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

  const result = schema.safeParse(req.body);
  validateOrThrow(result, req.requestId);

  req.body.validated = { loan: result.data };
  next();
};

export { validateLoan };
