import config from 'config';
import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.get('/', validateAuthToken, EmployeeController.getAll);
router.get('/:id', validateAuthToken, EmployeeController.getById);
router.post('/', validateAuthToken, validateCreateEmployee, EmployeeController.create);
router.put('/:id', validateAuthToken, validateUpdateEmployee, EmployeeController.update);

export default router;
