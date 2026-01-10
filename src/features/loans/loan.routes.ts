import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LoanController } from './loan.controller';
import { validateLoan } from './loan.validators';

const router = Router();

router.get('/', validateAuthToken, isInAllowedDepartment(['HR']), hasRequiredPermission('MANAGE_LOAN'), LoanController.get);
router.get(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOAN'),
  LoanController.getById,
);
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOAN'),
  validateLoan,
  LoanController.create,
);
router.put(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOAN'),
  validateLoan,
  LoanController.update,
);
router.delete(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LOAN'),
  LoanController.delete,
);

export { router as loanRoutes };
