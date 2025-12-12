import { NextFunction, Request, Response } from "express";
import {
  BaseError,
  ConnectionError,
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import { env } from "../config/env";
import { ApiError } from "./api-error";
import { logger } from "./logger";

const globalErrorHandler = (
  err: any, // Replace `any` with a custom error type if available
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  ["development", "test"].includes(env.NODE_ENV) &&
    console.log(
      "GLOBAL ERROR HANDLER:\n RequestID: ",
      req?.requestId,
      "\n",
      err,
    );
  logger.debug(err);

  err.ip = req.requestIp;
  err.origin = req.headers.origin || "undefined";
  err.referer = req.headers.referer || "undefined";

  if (err.name !== "ApiError") {
    if (err instanceof BaseError) {
      let message = "";
      switch (err.constructor.name) {
        case UniqueConstraintError.name:
          message = err.entity
            ? "Duplicate record not allowed for entity " +
              err.entity?.toLowerCase()
            : "Duplicate record not allowed";
          break;
        case ForeignKeyConstraintError.name:
          message = "Missing/invalid association field.";
          break;
        case ValidationError.name:
          message = "Oops! Looks like something is wrong with the request";
          break;
        case DatabaseError.name:
          message = "Oops! Looks like something is wrong with the request";
          break;

        default:
          message = "Oops! Something went wrong. Please try again later";
          break;
      }

      if (err instanceof ConnectionError) {
        logger.error("Unable to connect to DB.");
        err = ApiError.internalServerError(
          "Oops! Something went wrong on the server. Please try again later.",
        );
      } else {
        err = ApiError.badRequest(message);
      }
    } else {
      err = ApiError.internalServerError(
        "Oops! Something went wrong on the server. Please try again later",
      );
    }
  }

  logger.error(
    Object.assign(
      {},
      {
        method: req?.method,
        path: req?.requestPath,
        requestId: req?.requestId,
        stack: ["development", "test"].includes(env.NODE_ENV)
          ? err?.stack?.toString() || ""
          : null,
      },
      err,
    ),
  );

  return res
    .status(err.code || 500)
    .json({ success: false, message: err.message, data: {} });
};

export { globalErrorHandler };
