import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ExitController } from './exit.controller';
import { validateApproveExit, validateCreateExit, validateEmployeeIdParam, validateExitIdParam } from './exit.validators';

const router = Router();

// Create new exit request
router.post('/', validateAuthToken, validateCreateExit, ExitController.create);

// Get all exits (admin/HR only)
router.get('/', validateAuthToken, ExitController.getAll);

// Get exits by employee
router.get('/employee/:employeeId', validateAuthToken, validateEmployeeIdParam, ExitController.getByEmployee);

// Get single exit
router.get('/:id', validateAuthToken, validateExitIdParam, ExitController.getById);

// Update exit request
router.put('/:id', validateAuthToken, validateExitIdParam, ExitController.update);

// Delete exit request
router.delete('/:id', validateAuthToken, validateExitIdParam, ExitController.delete);

// Approve/reject exit request
router.patch('/:id/approve', validateAuthToken, validateExitIdParam, validateApproveExit, ExitController.approveExit);

export { router as exitRoutes };
