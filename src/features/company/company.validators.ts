import { NextFunction, Request, Response } from "express";

const validateCompany = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    // TODO: handle validation
    req.body.company = { name, description };
    next();
  } catch (error) {
    next(error);
  }
};

export { validateCompany };
