import { Router } from 'express';
import { validateAuthToken } from '../../features/authentication/auth.middleware';
import { isInAllowedDepartment } from '../../utils/check-permission';
import { DashboardController } from '../dashboard.controller';

const router = Router();

router.get('/', validateAuthToken, isInAllowedDepartment(['Group - Human Resources']), DashboardController.getStats);

export { router as hrDashboardRoutes };
