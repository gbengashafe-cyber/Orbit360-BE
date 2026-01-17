import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateOrThrow } from '../../utils/zod-validation-utils';

const checkInSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
});

const checkOutSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
});

const markAbsentSchema = z.object({
  employeeId: z.number().int('Employee ID must be an integer').min(1, 'Employee ID is required'),
  date: z.iso.date('Invalid date format'),
});

const getAttendanceByEmployeeParamsSchema = z.object({
  employeeId: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: 'Employee ID must be a number' })
    .transform(Number),
});

const validate =
  (schema: z.ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    validateOrThrow(result, req.requestId);
    next();
  };

const validateCheckIn = validate(checkInSchema, 'body');
const validateCheckOut = validate(checkOutSchema, 'body');
const validateMarkAbsent = validate(markAbsentSchema, 'body');
const validateGetAttendanceByEmployeeParams = validate(getAttendanceByEmployeeParamsSchema, 'params');

export { validateCheckIn, validateCheckOut, validateGetAttendanceByEmployeeParams, validateMarkAbsent };
