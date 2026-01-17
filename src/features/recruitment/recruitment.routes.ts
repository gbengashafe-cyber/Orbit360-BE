import { Router } from 'express';
import { JobPostingController, JobApplicationController } from './recruitment.controller';
import {
  validateCreateJobPosting,
  validateUpdateJobPosting,
  validateApproveJobPosting,
  validateJobPostingIdParam,
  validateCreateJobApplication,
  validateUpdateApplicationStatus,
  validateScheduleInterview,
  validateJobApplicationIdParam,
  validateJobPostingIdRouteParam,
} from './recruitment.validators';

const router = Router();

// Dashboard Stats
router.get('/dashboard/stats', JobPostingController.getDashboardStats);

// Job Postings
router.get('/postings', JobPostingController.getAll);
router.get('/postings/:id', validateJobPostingIdParam, JobPostingController.getById);
router.post('/postings', validateCreateJobPosting, JobPostingController.create);
router.put('/postings/:id', validateJobPostingIdParam, validateUpdateJobPosting, JobPostingController.update);
router.post('/postings/:id/approve', validateJobPostingIdParam, validateApproveJobPosting, JobPostingController.approve);
router.post('/postings/:id/reject', validateJobPostingIdParam, JobPostingController.reject);
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

export const recruitmentRoutes = router;
