import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { PayrollController } from './payroll.controller';
import { validateGeneratePayroll, validatePayrollIdParam, validateUpdatePayroll } from './payroll.validators';

const router = Router();

router.use(validateAuthToken);

router.param('employeeId', (req, res, next, val) => {
  req.params.employeeId = val.toUpperCase();
  next();
});

router.get('/', PayrollController.getAll);
router.get(
  '/employees/:employeeId',
  hasRequiredPermission('LIST_PAYROLLS', { allowAdmin: true }),
  PayrollController.getByEmployee,
);
router.get('/companies/:companyId/batches/periods/:payPeriod', PayrollController.getBatchByPeriod);
router.get('/companies/:companyId/periods/:payPeriod', PayrollController.getByPayPeriod);
router.get('/:id', validatePayrollIdParam, PayrollController.getById);
router.post('/', hasRequiredPermission('MANAGE_PAYROLLS'), validateGeneratePayroll, PayrollController.generate);
router.put('/:id', validatePayrollIdParam, validateUpdatePayroll, PayrollController.update);
router.patch('/:batchId/approval', validatePayrollIdParam, PayrollController.markAsApproved);
router.patch('/:batchId/rejection', validatePayrollIdParam, PayrollController.markAsRejected);
router.patch('/:batchId/override-request', hasRequiredPermission('MANAGE_PAYROLLS'), PayrollController.queueForOverride);
router.patch('/:batchId/override-approval', hasRequiredPermission('APPROVE_PAYROLL_OVERRIDE'), PayrollController.approveOverride);

export { router as payrollRoutes };
