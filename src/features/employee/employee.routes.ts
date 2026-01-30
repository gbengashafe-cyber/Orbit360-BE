import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.use([validateAuthToken, hasRequiredPermission('MANAGE_EMPLOYEES')]);

router.get('/', EmployeeController.getAll);
router.get('/:id', EmployeeController.getById);
router.post('/', validateCreateEmployee, EmployeeController.create);
router.put('/:id', validateUpdateEmployee, EmployeeController.update);

export default router;
