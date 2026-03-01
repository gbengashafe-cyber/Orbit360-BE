import { Router } from 'express';
import { JobPostingController } from './job-posting.controller';

const router = Router();

router.get('/', JobPostingController.getAll);
router.get('/:id', JobPostingController.getById);
router.post('/', JobPostingController.create);
router.put('/:id', JobPostingController.update);
router.post('/:id/approve', JobPostingController.approve);
router.post('/:id/reject', JobPostingController.reject);
router.post('/:id/close', JobPostingController.closeRole);
router.delete('/:id', JobPostingController.delete);

export default router;
