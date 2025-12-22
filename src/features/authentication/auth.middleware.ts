import { NextFunction, Request, Response } from 'express';

const validateAuthToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Handle authentication logic
    // req.user = { id: '1', role: 'SUPER_ADMIN' };
    req.user = { id: '1', role: 'SUPER_ADMIN' };
    next();
  } catch (error) {
    next(error);
  }
};

export { validateAuthToken };
