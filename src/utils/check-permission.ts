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

    if (!userJobRolePermissions || !userJobRolePermissions.length) {
      throw ApiError.internalServerError(`No permission found for user job role. User job role: ${req.user.jobRole}`);
    }

    const userHasRequiredPermission =
      req.user.role === 'ADMIN' ||
      userJobRolePermissions.find((_result) => _result.permission.toUpperCase() === requiredPermission.toUpperCase());

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
    logger.debug(`Checking required department: RequestId: ${req.requestId}: User department: ${req.user?.department}`);

    if (!req.user?.department) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userDepartmentIsAllowed = req.user.role === 'ADMIN' || requiredDepartment.includes(req.user.department.toUpperCase());

    if (!userDepartmentIsAllowed) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    logger.debug(`Checking required department: RequestId: ${req.requestId}: Successful`);
    next();
  };
};

export { hasRequiredPermission, isInAllowedDepartment };
