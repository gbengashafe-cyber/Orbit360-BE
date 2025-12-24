import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { UserController } from './user.controller';
import { validateUser } from './user.validation';

const router = Router();

router.post('/', validateAuthToken, hasRequiredPermission('ADMIN'), validateUser, UserController.create);
router.get('/', validateAuthToken, hasRequiredPermission('ADMIN'), UserController.get);
router.get('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), UserController.getById);
// router.put('/:id', validateAuthToken, hasRequiredRole(['ADMIN']), validateUser, UserController.update);

export { router as userRoutes };
