import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../utils/api-error';
import { moneySchema } from '../../utils/money.utils';
import { employeeStatus } from './employee-schema';

export const MONEY_PRECISION = {
  scale: 2,
  max: 9_999_999_999.99,
};

const emptyToNull = (val: unknown) => (val === '' ? null : val);

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.email('Invalid email format').max(100, 'Email cannot exceed 100 characters'),
  staffId: z.string().min(1, 'Staff ID is required').max(10, 'Only 10 characters are allowed for staff ID'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number cannot exceed 20 characters'),
  hireDate: z.iso.date('Invalid hire date format'),
  companyId: z.coerce.number('SBU (Company) is required').int('SBU (Company) is required'),
  departmentId: z.coerce.number('Employee department is required'),
  jobRoleId: z.coerce.number('Job role provided is not valid').positive('Job role provided is not valid'),
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
  annualRentAmount: moneySchema,
  beneficiaryName: z.string().nullable().nullable().optional(),
  beneficiaryRelationship: z.string().nullable().optional(),
  beneficiaryPhone: z.string().nullable().nullable().optional(),
  nokName: z.string().nullable().optional(),
  nokRelationship: z.string().nullable().optional(),
  nokPhone: z.string().nullable().optional(),
  leaveEntitlement: z.coerce.number().positive(),
  shouldCreateUser: z.boolean().default(false),
});

const updateEmployeeSchema = employeeSchema
  .extend({
    status: z.preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), z.enum(employeeStatus).optional()),
  })
  .partial();

const validate = (schema: z.ZodObject<any>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.parse(req.body);

    if (result?.id && result.id === result.supervisorId) {
      throw ApiError.badRequest('Employee and supervisor cannot be the same');
    }

    req.body.validated = { employee: result };
    next();
  };
};

const employeeLoanRequest = z.object({
  loanTypeId: z.coerce.number('Invalid loan type selected').min(1, 'Loan type is required'),
  principalAmount: z.coerce.number('Amount is required').positive('Amount must be greater than 0'),
  tenureMonths: z.coerce
    .number({ error: 'Loan tenure is required' })
    .int('Tenure must be a whole number')
    .positive('Tenure must be greater than 0'),
  startDate: z.iso.date('Kindly specify the date the loan is required').min(1, 'Please select the required date'),
  employeeNote: z.string().optional(),
});

const validateEmployeeLoanRequest = (req: Request, _res: Response, next: NextFunction) => {
  const result = employeeLoanRequest.parse(req.body);

  req.body.validated = { loan: result };
  next();
};

const validateCreateEmployee = validate(employeeSchema);
const validateUpdateEmployee = validate(updateEmployeeSchema);

export { validateCreateEmployee, validateEmployeeLoanRequest, validateUpdateEmployee };
