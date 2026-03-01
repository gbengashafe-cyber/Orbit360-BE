import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ExitController } from './exit.controller';
import { validateApproveExit, validateCreateExit, validateEmployeeIdParam, validateExitIdParam } from './exit.validators';

const router = Router();

router.use(validateAuthToken);

router.post('/', validateCreateExit, ExitController.create);

router.get('/', ExitController.getAll);

router.get('/employee/:employeeId', validateEmployeeIdParam, ExitController.getByEmployee);

router.get('/:id', validateExitIdParam, ExitController.getById);

router.put('/:id', validateExitIdParam, ExitController.update);

router.delete('/:id', validateExitIdParam, ExitController.delete);

router.patch('/:id/approve', validateExitIdParam, validateApproveExit, ExitController.approveExit);

export { router as exitRoutes };
