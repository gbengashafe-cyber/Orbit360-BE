import { NextFunction, Request, Response } from 'express';
import z from 'zod';

const loanTypeSchema = z.object({
  name: z.string().max(50, 'The name of the loan type cannot exceed 50 characters').trim(),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  maxTenureMonths: z.coerce.number().int('Tenure must be a whole number').min(1, 'Minimum tenure is 1 month'),
});

const validateLoanType = (req: Request, res: Response, next: NextFunction) => {
  const result = loanTypeSchema.parse(req.body);

  req.body.validated = { loanType: result };
  next();
};

export { validateLoanType };
