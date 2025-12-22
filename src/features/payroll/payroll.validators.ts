import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/api-error";

const createPayrollSchema = z.object({
  employeeId: z.number().int("Employee ID must be an integer").min(1, "Employee ID is required"),
  month: z.number().int("Month must be an integer").min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int("Year must be an integer").min(1900, "Year is invalid"), // Assuming a reasonable minimum year
  baseSalary: z.number().positive("Base salary must be a positive number"),
  allowances: z.number().min(0, "Allowances cannot be negative").optional().default(0),
  deductions: z.number().min(0, "Deductions cannot be negative").optional().default(0),
});

const updatePayrollSchema = z.object({
  baseSalary: z.number().positive("Base salary must be a positive number").optional(),
  allowances: z.number().min(0, "Allowances cannot be negative").optional().default(0),
  deductions: z.number().min(0, "Deductions cannot be negative").optional().default(0),
}).partial(); // All fields are optional for update

const payrollIdParamSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), { message: "Payroll ID must be a number" }).transform(Number),
});

const employeeIdParamSchema = z.object({
  employeeId: z.string().refine((val) => !isNaN(Number(val)), { message: "Employee ID must be a number" }).transform(Number),
});

type CreatePayrollBody = z.infer<typeof createPayrollSchema>;
type UpdatePayrollBody = z.infer<typeof updatePayrollSchema>;

const validate = (schema: z.ZodObject<any>, source: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error: any) {
      next(ApiError.badRequest(error.errors[0].message || "Validation Error"));
    }
  };

const validateCreatePayroll = validate(createPayrollSchema, "body");
const validateUpdatePayroll = validate(updatePayrollSchema, "body");
const validatePayrollIdParam = validate(payrollIdParamSchema, "params");
const validateEmployeeIdParam = validate(employeeIdParamSchema, "params");

export {
  validateCreatePayroll,
  validateUpdatePayroll,
  validatePayrollIdParam,
  validateEmployeeIdParam,
};
