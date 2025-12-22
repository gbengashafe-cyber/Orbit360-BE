import { NextFunction, Request, Response } from 'express';
import { RoleRepository } from '../features/role/role.repository';
import { ApiError } from './api-error';
import { logger } from './logger';

const hasRequiredRole = (requiredRole: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required role: RequestId: ${req.requestId}: ${requiredRole}`);
    try {
      if (!requiredRole.length) {
        throw ApiError.internalServerError('Required role is not specified.');
      }
      const _clonedRequiredRoles = [...requiredRole, 'SUPER_ADMIN'];

      const requiredRolesObject = await Promise.allSettled(
        _clonedRequiredRoles.map(async (_role) => await RoleRepository.getRoleByName(_role)),
      );

      if (!requiredRolesObject.length) {
        throw ApiError.internalServerError('Missing role maintenance.');
      }

      const userHasRequiredRole = requiredRolesObject.find((result) => {
        return result.status === 'fulfilled' && result.value?.name === req.user?.role;
      });

      if (!userHasRequiredRole) {
        throw ApiError.forbidden('You are not authorized to perform this action');
      }

      next();
    } catch (error) {
      logger.error(`RequestId: ${req.requestId}: Checking role failed`);
      next(error);
    }
  };
};

export { hasRequiredRole };
