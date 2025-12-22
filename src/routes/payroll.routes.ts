import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { validateCreatePayroll, validateUpdatePayroll, validatePayrollIdParam, validateEmployeeIdParam } from "../features/payroll/payroll.validators";

const router = Router();

router.get('/', PayrollController.getAll);
router.get('/employee/:employeeId', validateEmployeeIdParam, PayrollController.getByEmployee);
router.get('/:id', validatePayrollIdParam, PayrollController.getById);
router.post('/', validateCreatePayroll, PayrollController.create);
router.put('/:id', validatePayrollIdParam, validateUpdatePayroll, PayrollController.update);
router.post('/:id/process', validatePayrollIdParam, PayrollController.markProcessed);
router.post('/:id/pay', validatePayrollIdParam, PayrollController.markPaid);
router.delete('/:id', validatePayrollIdParam, PayrollController.delete);

export default router;
