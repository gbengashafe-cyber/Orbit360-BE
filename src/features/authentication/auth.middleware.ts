import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { JobRoleRepository } from '../job-role/job-role.repository';
import { UserRepository } from '../users/user.repository';
import { AuthUtil } from './auth.utils';

const validateAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw ApiError.unauthenticated('Authentication failed');
  }

  const bearerToken = authorization.split(' ')[1];

  const decodedToken = AuthUtil.decodeJwt(bearerToken);

  if (!decodedToken) {
    throw ApiError.unauthenticated('Authentication failed');
  }

  const user = await UserRepository.readById(decodedToken.id);

  if (!user) {
    throw ApiError.unauthenticated('Authentication failed');
  }

  const permissions = await JobRoleRepository.getJobRolePermissions(user.jobRole);

  req.user = { ...user, permissions: permissions };
  next();
};

export { validateAuthToken };
