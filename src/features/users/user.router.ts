import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { UserController } from './user.controller';
import { validateUser } from './user.validation';

const router = Router();

router.use([validateAuthToken, hasRequiredPermission('MANAGE_USERS')]);

router.post('/', validateUser, UserController.create);
router.put('/:id', validateUser, UserController.update);
router.get('/', UserController.get);
router.get('/job-roles', UserController.getJobRoles);
router.get('/:id', UserController.getById);

export { router as userRoutes };
