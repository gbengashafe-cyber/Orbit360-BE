import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const deductionSchema = z.object({
  name: z.string().min(1, 'Deduction name is required').max(50, 'Deduction name should not be more than 50 characters'),
  annualRate: z.number(),
  isPercentage: z.boolean(),
  optionalFieldLink: z.string().max(50),
  compensationFields: z.string(),
  isOptional: z.boolean(),
});

const updateDeductionSchema = deductionSchema.extend({ status: z.boolean() });

const validateDeduction = async (req: Request, res: Response, next: NextFunction) => {
  const isCreation = req.method === 'POST';
  const schema = isCreation ? deductionSchema : updateDeductionSchema;

  const result = schema.safeParse(req.body);

  validateOrThrow(result, req.requestId);

  req.body.validated = { deduction: result.data };
  next();
};
export { validateDeduction };
