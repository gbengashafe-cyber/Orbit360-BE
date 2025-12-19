import { NextFunction, Request, Response } from "express";

const validateAuthToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Handle authentication logic
    // req.body.authenticatedUser = {};
    req.body.authenticatedUser = { id: "1", role: 1 };
    next();
  } catch (error) {
    next(error);
  }
};

export { validateAuthToken };
