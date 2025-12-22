import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { validateCheckIn, validateCheckOut, validateMarkAbsent, validateGetAttendanceByEmployeeParams } from "../features/attendance/attendance.validators";

const router = Router();

router.get('/', AttendanceController.getAll);
router.get('/employee/:employeeId', validateGetAttendanceByEmployeeParams, AttendanceController.getByEmployee);
router.get('/:id', AttendanceController.getById);
router.post('/check-in', validateCheckIn, AttendanceController.checkIn);
router.post('/check-out', validateCheckOut, AttendanceController.checkOut);
router.post('/mark-absent', validateMarkAbsent, AttendanceController.markAbsent);
router.delete('/:id', AttendanceController.delete);

export default router;

router.get('/')