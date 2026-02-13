import { Router } from 'express';
import { isAdmin } from '../../../utils/check-permission';
import { validateAuthToken } from '../../authentication/auth.middleware';
import { validateLoanType } from './loan-type.validators';
import { LoanTypeController } from './loan-types.controller';

const router = Router();

router.use([validateAuthToken]);

router.get('/', LoanTypeController.getLoanTypes);
router.post('/', isAdmin, validateLoanType, LoanTypeController.create);

export { router as loanTypeRoutes };
