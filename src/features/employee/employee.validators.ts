import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { moneySchema } from '../../utils/money.utils';
import { employeeStatus } from './employee.model';

export const MONEY_PRECISION = {
  scale: 2,
  max: 9_999_999_999.99,
};

const emptyToNull = (val: unknown) => (val === '' ? null : val);

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.email('Invalid email format').max(100, 'Email cannot exceed 100 characters'),
  employeeId: z.string().min(1, 'Employee ID is required').max(10, 'Only 10 characters are allowed for employee ID'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number cannot exceed 20 characters'),
  hireDate: z.iso.date('Invalid hire date format'),
  departmentName: z.string().min(1, 'Employee department is required'),
  jobRole: z.string().min(1, 'Job role is required'),
  supervisorId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  dob: z.iso.date('Invalid dob date provided'),
  gender: z.enum(['M', 'F']),
  nationality: z.string().nullable().optional(),
  address: z.string().max(100, 'Address should not exceed 100 characters'),
  bankName: z.string().max(50).optional(),
  bankCode: z.string().max(30).optional(),
  accountNumber: z.string().max(20).optional(),
  accountName: z.string().max(100).optional(),
  nhfApplicable: z.coerce.boolean(),
  annualBasicSalary: moneySchema,
  annualHousingAllowance: moneySchema,
  annualTransportAllowance: moneySchema,
  annualLeaveAllowance: moneySchema,
  annualOtherAllowances: moneySchema,
  beneficiaryName: z.string().nullable().nullable().optional(),
  beneficiaryRelationship: z.string().nullable().optional(),
  beneficiaryPhone: z.string().nullable().nullable().optional(),
  nokName: z.string().nullable().optional(),
  nokRelationship: z.string().nullable().optional(),
  nokPhone: z.string().nullable().optional(),
  leaveEntitlement: z.number().positive(),
  createUser: z.boolean().default(false),
});

const updateEmployeeSchema = employeeSchema
  .extend({
    status: z.enum(employeeStatus).optional(),
  })
  .partial();

const validate = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.parse(req.body);

    if (result.employeeId && result.employeeId === result.supervisorId) {
      throw ApiError.badRequest('Employee and supervisor cannot be the same');
    }

    req.body.validated = { employee: result };
    next();
  };
};

const validateCreateEmployee = validate(employeeSchema);
const validateUpdateEmployee = validate(updateEmployeeSchema);

export { validateCreateEmployee, validateUpdateEmployee };
