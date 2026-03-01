import { Router } from 'express';
import { ComplaintController } from './complaint.controller';
import {
  validateCreateComplaint,
  validateUpdateComplaint,
  validateResolveComplaint,
  validateComplaintIdParam,
} from './complaint.validators';

const router = Router();

// Complaints
router.get('/', ComplaintController.getAll);
router.get('/:id', validateComplaintIdParam, ComplaintController.getById);
router.post('/', validateCreateComplaint, ComplaintController.create);
router.put('/:id', validateComplaintIdParam, validateUpdateComplaint, ComplaintController.update);
router.post('/:id/resolve', validateComplaintIdParam, validateResolveComplaint, ComplaintController.resolve);
router.post('/:id/close', validateComplaintIdParam, ComplaintController.close);
router.delete('/:id', validateComplaintIdParam, ComplaintController.delete);

export const complaintRoutes = router;
