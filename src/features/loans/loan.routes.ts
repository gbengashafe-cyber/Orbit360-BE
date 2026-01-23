import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LoanController } from './loan.controller';
import { validateLoan } from './loan.validators';

const router = Router();

router.get('/', validateAuthToken, isInAllowedDepartment(['HR']), hasRequiredPermission('MANAGE_LOANS'), LoanController.get);
router.get(
  '/dashboard',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOANS'),
  LoanController.getDashboard,
);
router.get(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOANS'),
  LoanController.getById,
);
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOANS'),
  validateLoan,
  LoanController.create,
);
router.put(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOANS'),
  validateLoan,
  LoanController.update,
);
router.delete(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOANS'),
  LoanController.delete,
);

export { router as loanRoutes };
