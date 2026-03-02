import { Router } from 'express';
import { validateAuthToken } from '../features/authentication/auth.middleware';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get('/', validateAuthToken, DashboardController.getStats);

export { router as dashboardRoutes };
