import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ExitController } from './exit.controller';
import { validateApproveExit, validateCreateExit, validateEmployeeIdParam, validateExitIdParam } from './exit.validators';

const router = Router();

router.use(validateAuthToken);

router.post('/', validateCreateExit, ExitController.create);
router.get('/', hasRequiredPermission('MANAGE_EXITS'), ExitController.getAll);
router.get('/employee/:employeeId', validateEmployeeIdParam, ExitController.getByEmployee);
router.get('/:id', validateExitIdParam, ExitController.getById);
router.patch(
  '/:id/approve',
  hasRequiredPermission('APPROVE_EXITS'),
  validateExitIdParam,
  validateApproveExit,
  ExitController.approveExit,
);

export { router as exitRoutes };
