import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.use([validateAuthToken]);

// Employee interactions
router.get('/me', EmployeeController.getUserEmployeeRecord);
router.get('/:id/payrolls', EmployeeController.getEmployeePayrollRecords);

// HR Interactions
router.get('/', hasRequiredPermission('LIST_EMPLOYEES'), EmployeeController.getAll);
router.get('/directory', hasRequiredPermission('LIST_EMPLOYEES'), EmployeeController.getDirectory);
router.get('/:id', hasRequiredPermission('LIST_EMPLOYEES'), EmployeeController.getById);
router.post('/', hasRequiredPermission('MANAGE_EMPLOYEES'), validateCreateEmployee, EmployeeController.createNewEmployee);
router.patch(
  '/:id',
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  validateCreateEmployee,
  EmployeeController.createEmployeeModRequest,
);
router.put('/:id', hasRequiredPermission('MANAGE_EMPLOYEES'), validateUpdateEmployee, EmployeeController.update);
router.patch('/:id/approval', EmployeeController.approve);
router.patch('/:id/rejection', EmployeeController.reject);

export default router;
