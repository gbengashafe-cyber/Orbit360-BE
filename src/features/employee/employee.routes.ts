import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.get(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  EmployeeController.getAll,
);
router.get(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  EmployeeController.getById,
);
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  validateCreateEmployee,
  EmployeeController.create,
);
router.put(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  validateUpdateEmployee,
  EmployeeController.update,
);
router.delete(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  EmployeeController.delete,
);

export default router;
