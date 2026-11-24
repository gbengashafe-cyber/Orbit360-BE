import { Router } from 'express';
import { hasAnyRequiredPermission, hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { ComplaintController } from './complaint.controller';
import {
  validateApproveComplaint,
  validateComplaintIdParam,
  validateCreateComplaint,
  validateListComplaintsQuery,
  validateRejectComplaint,
  validateReviewComplaint,
} from './complaint.validators';

const router = Router();

router.use(validateAuthToken);

// Employee
router.post('/', validateCreateComplaint, ComplaintController.create);
router.get('/me', ComplaintController.getMine);

// HR Officer / HR Manager
router.get(
  '/',
  hasAnyRequiredPermission(['MANAGE_COMPLAINTS', 'APPROVE_COMPLAINTS']),
  validateListComplaintsQuery,
  ComplaintController.getAll,
);

// Owner or HR (checked in the service)
router.get('/:id', validateComplaintIdParam, ComplaintController.getById);

// Stage 1: HR Officer review
router.patch(
  '/:id/review',
  hasRequiredPermission('MANAGE_COMPLAINTS'),
  validateComplaintIdParam,
  validateReviewComplaint,
  ComplaintController.review,
);

// Stage 2: HR Manager authorization
router.patch(
  '/:id/approve',
  hasRequiredPermission('APPROVE_COMPLAINTS'),
  validateComplaintIdParam,
  validateApproveComplaint,
  ComplaintController.approve,
);
router.patch(
  '/:id/reject',
  hasRequiredPermission('APPROVE_COMPLAINTS'),
  validateComplaintIdParam,
  validateRejectComplaint,
  ComplaintController.reject,
);

export const complaintRoutes = router;
