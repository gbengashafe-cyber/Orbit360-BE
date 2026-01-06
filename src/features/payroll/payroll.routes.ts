import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { PayrollController } from './payroll.controller';
import {
  validateEmployeeIdParam,
  validateGeneratePayroll,
  validatePayrollIdParam,
  validateUpdatePayroll,
} from './payroll.validators';

const router = Router();

router.get('/', PayrollController.getAll);
router.get('/employee/:employeeId', validateEmployeeIdParam, PayrollController.getByEmployee);
router.get('/:id', validatePayrollIdParam, PayrollController.getById);
router.get('/periods/:payPeriod', PayrollController.getByPayPeriod);
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLL'),
  validateGeneratePayroll,
  PayrollController.generatePayroll,
);
router.put('/:id', validatePayrollIdParam, validateUpdatePayroll, PayrollController.update);
router.post('/:id/process', validatePayrollIdParam, PayrollController.markProcessed);
router.post('/:id/pay', validatePayrollIdParam, PayrollController.markPaid);
router.delete('/:id', validatePayrollIdParam, PayrollController.delete);

export default router;
