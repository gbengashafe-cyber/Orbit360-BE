import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { PayrollController } from './payroll.controller';
import { validateGeneratePayroll, validateUpdatePayroll } from './payroll.validators';

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
router.get(
  '/companies/:companyId/batches/periods/:payPeriod',
  hasRequiredPermission('LIST_PAYROLLS'),
  PayrollController.getBatchByPeriod,
);
router.get('/companies/:companyId/periods/:payPeriod', hasRequiredPermission('LIST_PAYROLLS'), PayrollController.getByPayPeriod);
router.get('/:id', hasRequiredPermission('LIST_PAYROLLS'), PayrollController.getById);
router.post('/', hasRequiredPermission('MANAGE_PAYROLLS'), validateGeneratePayroll, PayrollController.generate);
router.put('/:id', hasRequiredPermission('MANAGE_PAYROLLS'), validateUpdatePayroll, PayrollController.update);
router.patch('/:id/approval', hasRequiredPermission('APPROVE_PAYROLLS'), PayrollController.markAsApproved);
router.patch('/:id/rejection', hasRequiredPermission('APPROVE_PAYROLLS'), PayrollController.markAsRejected);
router.patch('/:id/override-request', hasRequiredPermission('MANAGE_PAYROLLS'), PayrollController.queueForOverride);
router.patch('/:id/override-approval', hasRequiredPermission('APPROVE_PAYROLL_OVERRIDE'), PayrollController.approveOverride);

export { router as payrollRoutes };
