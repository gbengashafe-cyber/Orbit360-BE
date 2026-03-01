import { Router } from 'express';
import { validateAuthToken } from '../features/authentication/auth.middleware';
import { AuthorizationController } from './pending-authorization.controller';

const router = Router();

router.use(validateAuthToken);

router.get('/', AuthorizationController.getDashboard);
router.get('/counts', AuthorizationController.getCounts);
router.get('/:moduleName', AuthorizationController.getModulePending);

export { router as authorizationRoutes };
