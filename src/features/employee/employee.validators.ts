import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { moneySchema, toCents } from '../../utils/money.utils';

export const MONEY_PRECISION = {
  scale: 2,
  max: 9_999_999_999.99,
};

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.email('Invalid email format').max(100, 'Email cannot exceed 100 characters'),
  employeeId: z.string().min(1, 'Employee ID is required').max(10, 'Only 10 characters are allowed for employee ID'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number cannot exceed 20 characters').optional(),
  hireDate: z.iso.date('Invalid hire date format'),
  departmentName: z.string().min(1, 'Department ID is required'),
  supervisorId: z.string().nullable().optional(),
  position: z.string().min(1, 'Position ID is required'),
  dob: z.iso.date('Invalid dob date provided'),
  gender: z.enum(['M', 'F']),
  nationality: z.string().nullable().optional(),
  address: z.string().max(100, 'Address should not exceed 100 characters'),
});

const updateEmployeeSchema = employeeSchema
  .extend({
    status: z.enum(['active', 'inactive']).optional(),
  })
  .partial();

const createEmployeeSchema = employeeSchema.extend({
  compensation: z.object({
    bankName: z.string().max(50),
    bankCode: z.string().max(30),
    accountNumber: z.string().max(20),
    accountName: z.string().max(100),
    nhfApplicable: z.coerce.boolean(),
    annualBasicSalary: moneySchema.transform((val) => toCents(val)),
    annualHousingAllowance: moneySchema.transform((val) => toCents(val)),
    annualTransportAllowance: moneySchema.transform((val) => toCents(val)),
    annualLeaveAllowance: moneySchema.transform((val) => toCents(val)),
    otherAllowance: moneySchema.transform((val) => toCents(val)),
    beneficiaryName: z.string().nullable().nullable().optional(),
    beneficiaryRelationship: z.string().nullable().optional(),
    beneficiaryPhone: z.string().nullable().nullable().optional(),
    nokName: z.string().nullable(),
    nokRelationship: z.string().nullable(),
    nokPhone: z.string().nullable(),
    leaveEntitlement: z.number().positive(),
  }),
});

const validate = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((_error) => `${_error.path}: ${_error.message}`).join(', ');
      logger.debug(`RequestId: ${req.requestId}, Validation Error: ${errors}`);
      throw ApiError.badRequest(errors);
    }

    req.body.validated = { employee: result.data };
    next();
  };
};

const validateCreateEmployee = validate(createEmployeeSchema);
const validateUpdateEmployee = validate(updateEmployeeSchema);

export { validateCreateEmployee, validateUpdateEmployee };
