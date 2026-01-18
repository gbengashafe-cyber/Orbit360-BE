import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { moneySchema, toCents } from '../../utils/money.utils';
import { validateOrThrow } from '../../utils/zod-validation-utils';
import { employeeStatus } from './employee.model';

export const MONEY_PRECISION = {
  scale: 2,
  max: 9_999_999_999.99,
};

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.email('Invalid email format').max(100, 'Email cannot exceed 100 characters'),
  employeeId: z.string().min(1, 'Employee ID is required').max(10, 'Only 10 characters are allowed for employee ID'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number cannot exceed 20 characters'),
  hireDate: z.iso.date('Invalid hire date format'),
  departmentName: z.string().min(1, 'Department ID is required'),
  supervisorId: z.string().nullable().optional(),
  position: z.string().min(1, 'Position ID is required'),
  dob: z.iso.date('Invalid dob date provided'),
  gender: z.enum(['M', 'F']),
  nationality: z.string().nullable().optional(),
  address: z.string().max(100, 'Address should not exceed 100 characters'),
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
});

const updateEmployeeSchema = employeeSchema
  .extend({
    status: z.enum(employeeStatus).optional(),
  })
  .partial();

const validate = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    validateOrThrow(result, req.requestId);

    // Map position to jobRole
    const employeeData = {
      ...result.data,
      jobRole: result.data.position,
    };
    delete employeeData.position;

    req.body.validated = { employee: employeeData };
    next();
  };
};

const validateCreateEmployee = validate(employeeSchema);
const validateUpdateEmployee = validate(updateEmployeeSchema);

export { validateCreateEmployee, validateUpdateEmployee };
