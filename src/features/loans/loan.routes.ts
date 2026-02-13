import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LoanController } from './loan.controller';
import { validateLoan } from './loan.validators';

const router = Router();

router.use([validateAuthToken]);

router.get('/', hasRequiredPermission('LIST_LOANS'), LoanController.get);
router.get('/dashboard', LoanController.getDashboard);
router.get('/:id', hasRequiredPermission('MANAGE_LOANS'), LoanController.getById);
router.put('/:id', hasRequiredPermission('MANAGE_LOANS'), validateLoan, LoanController.update);
router.delete('/:id', hasRequiredPermission('MANAGE_LOANS'), LoanController.delete);
router.patch('/:id/approve', hasRequiredPermission('APPROVE_LOANS'), LoanController.approve);
router.patch('/:id/reject', hasRequiredPermission('APPROVE_LOANS'), LoanController.reject);

export { router as loanRoutes };
