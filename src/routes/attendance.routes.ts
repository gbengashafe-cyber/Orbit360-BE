import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';

const router = Router();

router.get('/', AttendanceController.getAll);
router.get('/employee/:employeeId', AttendanceController.getByEmployee);
router.get('/:id', AttendanceController.getById);
router.post('/check-in', AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);
router.post('/mark-absent', AttendanceController.markAbsent);
router.delete('/:id', AttendanceController.delete);

export default router;