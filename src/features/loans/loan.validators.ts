import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { loanStatus, reviewerDecisionOptions } from './loan.model';

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

const rejectLoanSchema = z.object({
  approverNote: z
    .string('The content of approval note must be a string of texts')
    .min(3, 'Note (rejection reason) is required')
    .max(300, 'Only 300 characters are allowed for notes'),
});

const approveLoanSchema = z.object({
  approverNote: z
    .string('The content of approval note must be a string of texts')
    .max(300, 'Only 300 characters are allowed for notes')
    .optional(),
});

const validateLoanApproval = (action: 'APPROVE' | 'REJECT') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    let schema: z.ZodObject;
    if (action?.toUpperCase() === 'REJECT') {
      schema = rejectLoanSchema;
    } else {
      schema = approveLoanSchema;
    }

    const result = schema.parse(req.body);

    req.body.validated = { approverNote: result.approverNote };
    next();
  };
};

const loanReviewSchema = z
  .object({
    reviewerDecision: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(reviewerDecisionOptions, 'Invalid decision was provided'),
    ),
    reviewerNote: z.string().max(300),
  })
  .refine(
    ({ reviewerDecision, reviewerNote }) => {
      return !(reviewerDecision.toUpperCase() === 'REJECT' && reviewerNote.length < 2);
    },
    { message: 'Note is required if decision is `Reject`', path: ['reviewerNote'] },
  );

const validateLoanReview = (req: Request, _res: Response, next: NextFunction) => {
  const result = loanReviewSchema.parse(req.body);

  req.body.validated = { validatedPayload: result };
  next();
};

export { validateLoan, validateLoanApproval, validateLoanReview };
