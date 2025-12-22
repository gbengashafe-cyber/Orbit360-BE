import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/api-error";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters"),
  email: z.string().email("Invalid email format").max(100, "Email cannot exceed 100 characters"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number cannot exceed 20 characters"),
  hireDate: z.string().datetime("Invalid hire date format"),
  salary: z.number().positive("Salary must be a positive number"),
  departmentId: z.number().int("Department ID must be an integer").min(1, "Department ID is required"),
  positionId: z.number().int("Position ID must be an integer").min(1, "Position ID is required"),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters").optional(),
  email: z.string().email("Invalid email format").max(100, "Email cannot exceed 100 characters").optional(),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number cannot exceed 20 characters").optional(),
  hireDate: z.string().datetime("Invalid hire date format").optional(),
  salary: z.number().positive("Salary must be a positive number").optional(),
  departmentId: z.number().int("Department ID must be an integer").min(1, "Department ID is required").optional(),
  positionId: z.number().int("Position ID must be an integer").min(1, "Position ID is required").optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>;
type UpdateEmployeeBody = z.infer<typeof updateEmployeeSchema>;

const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    next(ApiError.badRequest(error.errors[0].message || "Validation Error"));
  }
};

const validateCreateEmployee = validate(createEmployeeSchema);
const validateUpdateEmployee = validate(updateEmployeeSchema);

export { validateCreateEmployee, validateUpdateEmployee };

