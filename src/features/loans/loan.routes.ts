import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LoanController } from './loan.controller';
import { validateLoan } from './loan.validators';

const router = Router();

router.use([validateAuthToken, hasRequiredPermission('MANAGE_LOANS')]);

router.get('/', LoanController.get);
router.get('/dashboard', LoanController.getDashboard);
router.get('/:id', validateAuthToken, LoanController.getById);
router.post('/', validateAuthToken, validateLoan, LoanController.create);
router.put('/:id', validateAuthToken, validateLoan, LoanController.update);
router.delete('/:id', validateAuthToken, LoanController.delete);
router.patch('/:id/approve', hasRequiredPermission('APPROVE_LOANS'), LoanController.approve);
router.patch('/:id/reject', hasRequiredPermission('APPROVE_LOANS'), LoanController.reject);

export { router as loanRoutes };
