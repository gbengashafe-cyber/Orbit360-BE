import { NextFunction, Request, Response } from 'express';
import { ApiError } from './api-error';
import { logger } from './logger';

const hasRequiredPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: Required Permission: ${requiredPermission}`);
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: User job role: ${req.user?.jobRole}`);

    if (!req.user?.jobRole) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userJobRolePermissions = req.user.permissions;

    logger.debug(`Permissions for user: ${JSON.stringify(userJobRolePermissions)}`);

    const userHasRequiredPermission =
      req.user.role === 'ADMIN' ||
      userJobRolePermissions.find((_result) => _result.toUpperCase() === requiredPermission.toUpperCase());

    if (!userHasRequiredPermission) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    logger.debug(`Checking required permission: RequestId: ${req.requestId}: Successful`);
    next();
  };
};

const isInAllowedDepartment = (requiredDepartment: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required department: RequestId: ${req.requestId}: Required Department(s): ${requiredDepartment}`);
    logger.debug(`Checking required department: RequestId: ${req.requestId}: User department: ${req.user?.departmentName}`);

    if (!req.user?.departmentName) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userDepartmentIsAllowed =
      req.user.role === 'ADMIN' || requiredDepartment.includes(req.user.departmentName.toUpperCase());

    if (!userDepartmentIsAllowed) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    logger.debug(`Checking required department: RequestId: ${req.requestId}: Successful`);
    next();
  };
};

const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role?.toUpperCase() !== 'ADMIN') {
    throw ApiError.forbidden('You are not allowed to perform this action');
  }

  next();
};

export { hasRequiredPermission, isInAllowedDepartment, isAdmin };
