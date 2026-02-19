import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { EmployeeController } from './employee.controller';
import { validateCreateEmployee, validateEmployeeLoanRequest, validateUpdateEmployee } from './employee.validators';

const router = Router();

router.use([validateAuthToken]);

// Employee interactions
router.get('/me', EmployeeController.getUserEmployeeRecord);
router.get('/:id/payrolls', EmployeeController.getEmployeePayrollRecords);
router.get('/loans', EmployeeController.getLoanRecords);
router.post('/loans', validateEmployeeLoanRequest, EmployeeController.createLoanRequest);
router.patch('/loans/:loanId/cancellation', EmployeeController.cancelLoanRequest);

// HR Interactions
router.get('/', hasRequiredPermission('LIST_EMPLOYEES', { allowAdmin: true }), EmployeeController.getAll);
router.get('/directory', hasRequiredPermission('LIST_EMPLOYEES', { allowAdmin: true }), EmployeeController.getDirectory);
router.get('/:id', hasRequiredPermission('LIST_EMPLOYEES', { allowAdmin: true }), EmployeeController.getById);
router.post('/', hasRequiredPermission('MANAGE_EMPLOYEES'), validateCreateEmployee, EmployeeController.createCreationRequest);
router.patch(
  '/:id',
  hasRequiredPermission('MANAGE_EMPLOYEES'),
  validateUpdateEmployee,
  EmployeeController.createModificationRequest,
);
router.post('/maintenance/:id/approval', hasRequiredPermission('APPROVE_EMPLOYEES'), EmployeeController.approve);
router.post('/maintenance/:id/rejection', hasRequiredPermission('APPROVE_EMPLOYEES'), EmployeeController.reject);

export { router as employeeRoutes };
