import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.use(validateAuthToken);

router.get('/', EmployeeController.getAll);
router.get('/:id', EmployeeController.getById);
router.post('/', validateCreateEmployee, EmployeeController.create);
router.put('/:id', validateUpdateEmployee, EmployeeController.update);

router.put(
  '/:id/status',
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  validateUpdateEmployee,
  EmployeeController.update,
);

export default router;
