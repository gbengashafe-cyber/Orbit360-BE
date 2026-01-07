import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { DeductionController } from './deduction.controller';
import { validateDeduction } from './deduction.validators';

const router = Router();

router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLL'),
  validateDeduction,
  DeductionController.create,
);
router.get(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLL'),
  DeductionController.get,
);
router.get(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLL'),
  DeductionController.getById,
);
router.put(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLL'),
  validateDeduction,
  DeductionController.update,
);

export { router as deductionRouter };
