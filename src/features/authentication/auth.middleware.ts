import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { JobRoleRepository } from '../job-role/job-role.repository';
import { UserRepository } from '../users/user.repository';
import { AuthUtil, TOKEN_FINGERPRINT_COOKIE_NAME } from './auth.utils';
import { TokenUtil } from './token.util';
import { EmployeeRepository } from '../employee/employee.repository';

const validateAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    logger.error(`${req.requestId}: Authentication failed. Missing authorization header.`);
    throw ApiError.unauthenticated('Authentication failed');
  }

  const bearerToken = authorization.split(' ')[1];
  const tokenFingerprint = req.cookies[TOKEN_FINGERPRINT_COOKIE_NAME];

  if (!tokenFingerprint) {
    logger.error(`${req.requestId}: Authentication failed. Token fingerprint is missing.`);
    throw ApiError.unauthenticated('Missing user context cookie');
  }

  const decodedToken = TokenUtil.decodeToken(bearerToken);

  if (!decodedToken) {
    logger.error(`${req.requestId}: Authentication failed. Token validation failed.`);
    throw ApiError.unauthenticated('Authentication failed');
  }

  const expectedFingerprintHash = decodedToken.ctx;
  const actualFingerPrintHash = AuthUtil.hashUserContext(tokenFingerprint);

  if (expectedFingerprintHash !== actualFingerPrintHash) {
    logger.error(`${req.requestId}: Authentication failed. Token fingerprint validation failed.`);
    throw ApiError.unauthenticated('Authentication failed');
  }

  const user = await UserRepository.readById(decodedToken.sub);

  if (!user) {
    logger.error(`${req.requestId}: Authentication failed. User not found.`);
    throw ApiError.unauthenticated('Authentication failed');
  }

  const permissions = await JobRoleRepository.getJobRolePermissions(user.jobRole);

  req.user = { ...user, permissions: permissions };
  const userEmployeeSearch = await EmployeeRepository.read({ rows: 1, page: 1, filters: { search: user.email } });

  if (userEmployeeSearch) {
    req.user.employeeRecord = userEmployeeSearch[0];
  }
  next();
};

export { validateAuthToken };
