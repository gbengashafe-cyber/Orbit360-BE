import { NextFunction, Request, Response } from 'express';
import { PositionRepository } from '../features/position/position.repository';
import { ApiError } from './api-error';
import { logger } from './logger';

const hasRequiredPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: RequiredPermission: ${requiredPermission}`);
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: User position: ${req.user?.position}`);
    try {
      if (!req.user?.position) {
        throw ApiError.forbidden('Missing authorization. You are not authorized to perform this action.');
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

      next();
    } catch (error) {
      logger.error(`RequestId: ${req.requestId}: Checking permission failed`);
      next(error);
    }
  };
};

export { hasRequiredPermission };
