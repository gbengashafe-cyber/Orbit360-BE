import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { validateAuthToken } from '../features/authentication/auth.middleware';

const router = Router();

router.get('/', validateAuthToken, DashboardController.getStats);

export { router as dashboardRoutes };
