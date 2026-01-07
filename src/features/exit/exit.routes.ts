import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ExitController } from './exit.controller';
import {
  validateApproveExit,
  validateCreateExit,
  validateEmployeeIdParam,
  validateExitIdParam,
} from './exit.validators';

const router = Router();

router.post('/', validateAuthToken, validateCreateExit, ExitController.create);
router.get(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EXITS'),
  ExitController.getAll,
);
router.get('/employee/:employeeId', validateAuthToken, validateEmployeeIdParam, ExitController.getByEmployee);
router.get('/:id', validateAuthToken, validateExitIdParam, ExitController.getById);
router.patch(
  '/:id/approve',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('APPROVE_EXITS'),
  validateExitIdParam,
  validateApproveExit,
  ExitController.approveExit,
);

export { router as exitRoutes };
