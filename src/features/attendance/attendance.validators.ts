import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/api-error";

const checkInSchema = z.object({
  employeeId: z.number().int("Employee ID must be an integer").min(1, "Employee ID is required"),
});

const checkOutSchema = z.object({
  employeeId: z.number().int("Employee ID must be an integer").min(1, "Employee ID is required"),
});

const markAbsentSchema = z.object({
  employeeId: z.number().int("Employee ID must be an integer").min(1, "Employee ID is required"),
  date: z.string().datetime("Invalid date format"),
});

const getAttendanceByEmployeeParamsSchema = z.object({
  employeeId: z.string().refine((val) => !isNaN(Number(val)), { message: "Employee ID must be a number" }).transform(Number),
});

type CheckInBody = z.infer<typeof checkInSchema>;
type CheckOutBody = z.infer<typeof checkOutSchema>;
type MarkAbsentBody = z.infer<typeof markAbsentSchema>;

const validate = (schema: z.ZodObject<any>, source: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error: any) {
      next(ApiError.badRequest(error.errors[0].message || "Validation Error"));
    }
  };

const validateCheckIn = validate(checkInSchema, "body");
const validateCheckOut = validate(checkOutSchema, "body");
const validateMarkAbsent = validate(markAbsentSchema, "body");
const validateGetAttendanceByEmployeeParams = validate(getAttendanceByEmployeeParamsSchema, "params");

export {
  validateCheckIn,
  validateCheckOut,
  validateMarkAbsent,
  validateGetAttendanceByEmployeeParams,
};
