import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { PayrollController } from './payroll.controller';
import {
  validateGeneratePayroll,
  validatePayrollIdParam,
  validatePayrollStatus,
  validateUpdatePayroll,
} from './payroll.validators';

const router = Router();

router.use(validateAuthToken);

router.param('employeeId', (req, res, next, val) => {
  req.params.employeeId = val.toUpperCase();
  next();
});

router.get('/', PayrollController.getAll);
router.get('/employees/:employeeId', hasRequiredPermission('MANAGE_PAYROLLS'), PayrollController.getByEmployee);
router.get('/:id', validatePayrollIdParam, PayrollController.getById);
router.get('/periods/:payPeriod', PayrollController.getByPayPeriod);
router.post(
  '/',
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLLS'),
  validateGeneratePayroll,
  PayrollController.generatePayroll,
);
router.put('/:id/status', validatePayrollStatus, PayrollController.updateStatus);
router.put('/:id', validatePayrollIdParam, validateUpdatePayroll, PayrollController.update);
router.patch('/:id/approval', validatePayrollIdParam, PayrollController.markAsApproved);
router.patch('/:id/rejection', validatePayrollIdParam, PayrollController.markAsRejected);
router.delete('/:id', validatePayrollIdParam, PayrollController.delete);

export default router;
