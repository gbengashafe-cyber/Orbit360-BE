import { NextFunction, Request, Response } from 'express';
import { PositionRepository } from '../features/position/position.repository';
import { ApiError } from './api-error';
import { logger } from './logger';

const hasRequiredPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: RequiredPermission: ${requiredPermission}`);
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: User position: ${req.user?.position}`);
    if (!req.user?.position) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userPositionPermissions = await PositionRepository.getPermissionsByTitle(req.user.position);

    if (!userPositionPermissions) {
      throw ApiError.internalServerError('No permission found for this position');
    }

    const userHasRequiredPermission =
      req.user.role === 'ADMIN' ||
      userPositionPermissions.find((_result) => _result.permission.toUpperCase() === requiredPermission.toUpperCase());

    if (!userHasRequiredPermission) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    logger.debug(`Checking required permission: RequestId: ${req.requestId}: Successful`);
    next();
  };
};

const isInAllowedDepartment = (requiredDepartment: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required department: RequestId: ${req.requestId}: RequiredDepartment(s): ${requiredDepartment}`);
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
