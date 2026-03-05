import { NextFunction, Request, Response } from 'express';
import { Department } from '../features/department/department.model';
import { Permission } from '../features/permissions';
import { ApiError } from './api-error';
import { logger } from './logger';

const hasRequiredPermission = (permission: Permission, { allowAdmin = false }: { allowAdmin?: boolean } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: Required Permission: ${permission}`);
    logger.debug(`Checking required permission: RequestId: ${req.requestId}: User job role: ${req.user?.jobRoleId}`);

    if (allowAdmin && req.user?.role?.toUpperCase() === 'ADMIN') {
      return next();
    }

    if (!req.user?.jobRoleId) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userJobRolePermissions = req.user.permissions ?? [];

    logger.debug(`Permissions for user: ${JSON.stringify(userJobRolePermissions)}`);

    const hasPermission = userJobRolePermissions.some((_result) => _result.toUpperCase() === permission.toUpperCase());

    if (!hasPermission) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    return next();
  };
};

const isInAllowedDepartment = (requiredDepartment: string[], { allowAdmin = false } = { allowAdmin: false }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Checking required department: RequestId: ${req.requestId}: Required Department(s): ${requiredDepartment}`);
    logger.debug(`Checking required department: RequestId: ${req.requestId}: User department: ${req.user?.departmentId}`);

    if (allowAdmin && req.user?.role?.toUpperCase() === 'ADMIN') {
      return next();
    }

    if (!req.user?.departmentId) {
      throw ApiError.forbidden('Missing/incomplete authorization header. You are not authorized to perform this action.');
    }

    const userDepartment = await Department.findByPk(req.user.departmentId);

    if (!userDepartment) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    const userDepartmentIsAllowed = requiredDepartment.includes(userDepartment.name);

    if (!userDepartmentIsAllowed) {
      throw ApiError.forbidden('You are not authorized to perform this action');
    }

    logger.debug(`Checking required department: RequestId: ${req.requestId}: Successful`);
    return next();
  };
};

const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role?.toUpperCase() !== 'ADMIN') {
    throw ApiError.forbidden('Only admin user can perform this action');
  }

  return next();
};

export { hasRequiredPermission, isAdmin, isInAllowedDepartment };
