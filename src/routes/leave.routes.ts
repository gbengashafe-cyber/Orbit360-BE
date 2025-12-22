import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { validateCreateLeave, validateLeaveIdParam, validateEmployeeIdParam } from "../features/leave/leave.validators";

const router = Router();

router.get('/', LeaveController.getAll);
router.get('/employee/:employeeId', validateEmployeeIdParam, LeaveController.getByEmployee);
router.get('/:id', validateLeaveIdParam, LeaveController.getById);
router.post('/', validateCreateLeave, LeaveController.create);
router.post('/:id/approve', validateLeaveIdParam, LeaveController.approve);
router.post('/:id/reject', validateLeaveIdParam, LeaveController.reject);
router.delete('/:id', validateLeaveIdParam, LeaveController.cancel);

export default router;
