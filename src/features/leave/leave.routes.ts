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

router.use(validateAuthToken);

router.post('/', upload.any(), validateCreateLeave, LeaveController.create);
router.post('/calculate/days', LeaveController.calculateLeaveDays);
router.get('/', LeaveController.getAll);
router.get('/employee/:employeeId', validateEmployeeIdParam, LeaveController.getByEmployee);
router.get('/types', LeaveController.getLeaveTypes);
router.get('/balance/:employeeId', validateEmployeeIdParam, LeaveController.getLeaveBalance);
router.get('/:id', validateLeaveIdParam, LeaveController.getById);
router.patch('/:id/status', validateLeaveIdParam, validateApproveDecline, LeaveController.approveOrDecline);
router.delete('/:id', validateLeaveIdParam, LeaveController.cancel);

export { router as leaveRoutes };
