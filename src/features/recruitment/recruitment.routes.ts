import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { JobApplicationController, JobPostingController } from './recruitment.controller';
import {
  validateCreateJobApplication,
  validateJobApplicationIdParam,
  validateJobPostingIdParam,
  validateJobPostingIdRouteParam,
  validateScheduleInterview,
  validateUpdateApplicationStatus,
  validateUpdateJobPosting,
} from './recruitment.validators';
import { validateAuthToken } from '../authentication/auth.middleware';

const router = Router();

router.use(validateAuthToken);

// Dashboard Stats
router.get('/dashboard/stats', JobPostingController.getDashboardStats);

// Job Postings
router.get('/postings', JobPostingController.getAll);
router.get('/postings/:id', validateJobPostingIdParam, JobPostingController.getById);
router.post('/postings', hasRequiredPermission('MANAGE_JOB_POSTINGS'), JobPostingController.create);
router.put('/postings/:id', validateJobPostingIdParam, validateUpdateJobPosting, JobPostingController.update);
router.post('/postings/:id/approve', hasRequiredPermission('APPROVE_JOB_POSTINGS'), JobPostingController.approve);
router.post(
  '/postings/:id/reject',
  hasRequiredPermission('APPROVE_JOB_POSTINGS'),
  validateJobPostingIdParam,
  JobPostingController.reject,
);
router.post('/postings/:id/close', validateJobPostingIdParam, JobPostingController.closeRole);
router.delete('/postings/:id', validateJobPostingIdParam, JobPostingController.delete);

// Job Applications
router.get('/applications', JobApplicationController.getAll);
router.get('/applications/:id', validateJobApplicationIdParam, JobApplicationController.getById);
router.get('/applications/by-posting/:jobPostingId', validateJobPostingIdRouteParam, JobApplicationController.getByJobPosting);
router.get('/applications/pipeline/:jobPostingId', validateJobPostingIdRouteParam, JobApplicationController.getPipeline);
router.post('/applications', validateCreateJobApplication, JobApplicationController.create);
router.put(
  '/applications/:id/status',
  validateJobApplicationIdParam,
  validateUpdateApplicationStatus,
  JobApplicationController.updateStatus,
);
router.post(
  '/applications/:id/schedule-interview',
  validateJobApplicationIdParam,
  validateScheduleInterview,
  JobApplicationController.scheduleInterview,
);
router.post('/applications/:id/send-offer', validateJobApplicationIdParam, JobApplicationController.sendOffer);
router.post('/applications/:id/hire', validateJobApplicationIdParam, JobApplicationController.hire);
router.post('/applications/:id/reject', validateJobApplicationIdParam, JobApplicationController.reject);
router.delete('/applications/:id', validateJobApplicationIdParam, JobApplicationController.delete);

export { router as recruitmentRoutes };
