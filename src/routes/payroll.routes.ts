import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';

const router = Router();

router.get('/', PayrollController.getAll);
router.get('/employee/:employeeId', PayrollController.getByEmployee);
router.get('/:id', PayrollController.getById);
router.post('/', PayrollController.create);
router.put('/:id', PayrollController.update);
router.post('/:id/process', PayrollController.markProcessed);
router.post('/:id/pay', PayrollController.markPaid);
router.delete('/:id', PayrollController.delete);

export default router;
