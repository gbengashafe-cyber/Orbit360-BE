import { Router } from 'express';
import { JobApplicationController } from '../controllers/job-application.controller';

const router = Router();

router.get('/', JobApplicationController.getAll);
router.get('/:id', JobApplicationController.getById);
router.get('/job-posting/:jobPostingId', JobApplicationController.getByJobPosting);
router.post('/', JobApplicationController.create);
router.put('/:id/status', JobApplicationController.updateStatus);
router.post('/:id/schedule-interview', JobApplicationController.scheduleInterview);
router.post('/:id/send-offer', JobApplicationController.sendOffer);
router.post('/:id/hire', JobApplicationController.hire);
router.post('/:id/reject', JobApplicationController.reject);
router.delete('/:id', JobApplicationController.delete);

export default router;
