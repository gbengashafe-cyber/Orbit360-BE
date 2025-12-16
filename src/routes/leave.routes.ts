import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';

const router = Router();

router.get('/', LeaveController.getAll);
router.get('/employee/:employeeId', LeaveController.getByEmployee);
router.get('/:id', LeaveController.getById);
router.post('/', LeaveController.create);
router.post('/:id/approve', LeaveController.approve);
router.post('/:id/reject', LeaveController.reject);
router.delete('/:id', LeaveController.cancel);

export default router;
