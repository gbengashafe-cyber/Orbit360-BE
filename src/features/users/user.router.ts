import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { UserController } from './user.controller';
import { validateUser } from './user.validation';

const router = Router();

router.post('/', validateAuthToken, hasRequiredPermission('MANAGE_USER'), validateUser, UserController.create);
router.put('/:id', validateAuthToken, hasRequiredPermission('MANAGE_USER'), validateUser, UserController.update);
router.get('/', validateAuthToken, hasRequiredPermission('MANAGE_USER'), UserController.get);
router.get('/job-roles', validateAuthToken, hasRequiredPermission('MANAGE_USER'), UserController.getJobRoles);
router.get('/:id', validateAuthToken, hasRequiredPermission('MANAGE_USER'), UserController.getById);

export { router as userRoutes };
