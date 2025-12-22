import { Router } from 'express';
import { hasRequiredRole } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { DeductionController } from './deduction.controller';

const router = Router();

router.post('/', validateAuthToken, hasRequiredRole(['HR_ADMIN']), DeductionController.create);
router.get('/', validateAuthToken, hasRequiredRole(['HR_ADMIN']), DeductionController.get);
router.get('/:id', validateAuthToken, hasRequiredRole(['HR_ADMIN']), DeductionController.getById);
router.put('/:id', validateAuthToken, hasRequiredRole(['HR_ADMIN']), DeductionController.update);
router.delete('/:id', validateAuthToken, hasRequiredRole(['HR_ADMIN']), DeductionController.delete);

export { router as deductionRouter };
