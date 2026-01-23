import { Router } from 'express';
import { canAccessResource, hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { PayrollController } from './payroll.controller';
import {
  validateGeneratePayroll,
  validatePayrollIdParam,
  validatePayrollStatus,
  validateUpdatePayroll,
} from './payroll.validators';

const router = Router();

router.param('employeeId', (req, res, next, val) => {
  req.params.employeeId = val.toUpperCase();
  next();
});

router.get('/', PayrollController.getAll);
router.get(
  '/employee/:employeeId',
  validateAuthToken,
  canAccessResource({ matcherProp: 'employeeId', requiredPermission: 'MANAGE_PAYROLLS' }),
  PayrollController.getByEmployee,
);
router.get('/:id', validatePayrollIdParam, PayrollController.getById);
router.get('/periods/:payPeriod', PayrollController.getByPayPeriod);
router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_PAYROLLS'),
  validateGeneratePayroll,
  PayrollController.generatePayroll,
);
router.put('/:id/status', validatePayrollStatus, PayrollController.updateStatus);
router.put('/:id', validatePayrollIdParam, validateUpdatePayroll, PayrollController.update);
router.post('/:id/process', validatePayrollIdParam, PayrollController.markProcessed);
router.post('/:id/pay', validatePayrollIdParam, PayrollController.markPaid);
router.delete('/:id', validatePayrollIdParam, PayrollController.delete);

export default router;
