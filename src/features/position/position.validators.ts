import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/api-error";

const createPositionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional().nullable(),
});

const updatePositionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters").optional(),
  description: z.string().optional().nullable(),
});

type CreatePositionBody = z.infer<typeof createPositionSchema>;
type UpdatePositionBody = z.infer<typeof updatePositionSchema>;

const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    next(ApiError.badRequest(error.errors[0].message || "Validation Error"));
  }
};

const validateCreatePosition = validate(createPositionSchema);
const validateUpdatePosition = validate(updatePositionSchema);

export { validateCreatePosition, validateUpdatePosition };

