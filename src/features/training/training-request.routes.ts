import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { TrainingRequestController } from './training-request.controller';

const router = Router();

// Middleware to ensure user is authenticated
router.use(validateAuthToken);

/**
 * POST /api/training-requests
 * Submit a new training request
 * Roles: Employee, Supervisor
 */
router.post('/', TrainingRequestController.submitRequest);

/**
 * GET /api/training-requests
 * Get training requests based on user role
 * - Employee: only their own requests
 * - Supervisor: requests they need to approve
 * - HR: all requests with status filter option
 */
router.get('/', TrainingRequestController.getRequests);

/**
 * GET /api/training-requests/:id
 * Get specific training request details
 */
router.get('/:id', TrainingRequestController.getRequestById);

/**
 * PUT /api/training-requests/:id/supervisor-approval
 * Supervisor approves or rejects training request
 * Body: { approved: boolean, rejectionReason?: string }
 */
router.put('/:id/supervisor-approval', TrainingRequestController.supervisorApprove);

/**
 * PUT /api/training-requests/:id/hr-approval
 * HR Officer approves or rejects training request
 * Body: { approved: boolean, rejectionReason?: string }
 */
router.put('/:id/hr-approval', TrainingRequestController.hrApprove);

/**
 * PUT /api/training-requests/:id/final-approval
 * HR Manager gives final approval or rejection
 * Body: { approved: boolean, rejectionReason?: string }
 */
router.put('/:id/final-approval', TrainingRequestController.finalApprove);

/**
 * DELETE /api/training-requests/:id
 * Delete training request (only if pending)
 */
router.delete('/:id', TrainingRequestController.deleteRequest);

export { router as trainingRequestRoutes };
