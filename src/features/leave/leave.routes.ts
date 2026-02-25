import { Router } from 'express';
import multer from 'multer';
import { validateAuthToken } from '../authentication/auth.middleware';
import { LeaveController } from './leave.controller';
import { validateApproveDecline, validateCreateLeave, validateEmployeeIdParam, validateLeaveIdParam } from './leave.validators';

const router = Router();

// Configure multer for leave file uploads (supporting_documents, handover_documents)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10, // max 10 files
  },
});

router.post('/', validateAuthToken, upload.any(), validateCreateLeave, LeaveController.create);
router.post('/calculate/days', validateAuthToken, LeaveController.calculateLeaveDays);
router.get('/', validateAuthToken, LeaveController.getAll);
router.get('/employee/:employeeId', validateAuthToken, validateEmployeeIdParam, LeaveController.getByEmployee);
router.get('/types', validateAuthToken, LeaveController.getLeaveTypes);
router.get('/balance/:employeeId', validateAuthToken, validateEmployeeIdParam, LeaveController.getLeaveBalance);
router.get('/:id', validateAuthToken, validateLeaveIdParam, LeaveController.getById);
router.patch('/:id/status', validateAuthToken, validateLeaveIdParam, validateApproveDecline, LeaveController.approveOrDecline);
router.delete('/:id', validateAuthToken, validateLeaveIdParam, LeaveController.cancel);

export { router as leaveRoutes };
