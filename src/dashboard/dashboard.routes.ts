import { Router } from 'express';
import { validateAuthToken } from '../features/authentication/auth.middleware';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get('/', validateAuthToken, DashboardController.getStats);
router.get('/me', validateAuthToken, DashboardController.getPersonal);

export { router as dashboardRoutes };
