import { Router } from 'express';
import { JobPostingController, JobApplicationController } from './recruitment.controller';

const router = Router();

// Dashboard Stats
router.get('/dashboard/stats', JobPostingController.getDashboardStats);

// Job Postings
router.get('/postings', JobPostingController.getAll);
router.get('/postings/:id', JobPostingController.getById);
router.post('/postings', JobPostingController.create);
router.put('/postings/:id', JobPostingController.update);
router.post('/postings/:id/approve', JobPostingController.approve);
router.post('/postings/:id/reject', JobPostingController.reject);
router.post('/postings/:id/close', JobPostingController.closeRole);
router.delete('/postings/:id', JobPostingController.delete);

// Job Applications
router.get('/applications', JobApplicationController.getAll);
router.get('/applications/:id', JobApplicationController.getById);
router.get('/applications/by-posting/:jobPostingId', JobApplicationController.getByJobPosting);
router.post('/applications', JobApplicationController.create);
router.put('/applications/:id/status', JobApplicationController.updateStatus);
router.post('/applications/:id/schedule-interview', JobApplicationController.scheduleInterview);
router.post('/applications/:id/send-offer', JobApplicationController.sendOffer);
router.post('/applications/:id/hire', JobApplicationController.hire);
router.post('/applications/:id/reject', JobApplicationController.reject);
router.delete('/applications/:id', JobApplicationController.delete);

export const recruitmentRoutes = router;
