import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LoanController } from './loan.controller';
import { validateLoan, validateLoanApproval, validateLoanReview } from './loan.validators';

const router = Router();

router.use([validateAuthToken]);

router.get('/', hasRequiredPermission('LIST_LOANS', { allowAdmin: true }), LoanController.get);
router.get('/dashboard', LoanController.getDashboard);
router.get('/:id', hasRequiredPermission('LIST_LOANS'), LoanController.getById);
router.put('/:id', hasRequiredPermission('MANAGE_LOANS'), validateLoan, LoanController.update);
router.patch('/:loanId/reviews', hasRequiredPermission('MANAGE_LOANS'), validateLoanReview, LoanController.reviewLoanRequest);
router.patch(
  '/:loanId/approve',
  hasRequiredPermission('APPROVE_LOANS'),
  validateLoanApproval('APPROVE'),
  LoanController.approveReview,
);
router.patch('/:loanId/reject', hasRequiredPermission('APPROVE_LOANS'), validateLoanApproval('REJECT'), LoanController.reject);

export { router as loanRoutes };
