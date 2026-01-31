import { Router } from 'express';
import { validateAuthToken } from '../features/authentication/auth.middleware';
import { ApprovalController } from './pending-authorization.controller';

const router = Router();

router.use(validateAuthToken);

router.get('/', ApprovalController.getDashboard);
router.get('/counts', ApprovalController.getCounts);

export { router as authorizationRoutes };
