import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { UserController } from './user.controller';
import { validateUser } from './user.validation';

const router = Router();

router.post('/', validateAuthToken, hasRequiredPermission('MANAGE_USERS'), validateUser, UserController.create);
router.put('/:id', validateAuthToken, hasRequiredPermission('MANAGE_USERS'), validateUser, UserController.update);
router.get('/', validateAuthToken, hasRequiredPermission('MANAGE_USERS'), UserController.get);
router.get('/job-roles', validateAuthToken, hasRequiredPermission('MANAGE_USERS'), UserController.getJobRoles);
router.get('/:id', validateAuthToken, hasRequiredPermission('MANAGE_USERS'), UserController.getById);

export { router as userRoutes };
