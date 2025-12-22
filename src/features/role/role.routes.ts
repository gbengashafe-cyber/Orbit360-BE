import { Router } from 'express';
import { hasRequiredRole } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { RoleController } from './role.controller';
import { validateRole } from './role.validation';

const router = Router();

router.post('/', validateAuthToken, hasRequiredRole(['ADMIN']), validateRole, RoleController.create);
router.get('/', validateAuthToken, hasRequiredRole(['ADMIN']), RoleController.get);
router.get('/:id', validateAuthToken, hasRequiredRole(['ADMIN']), RoleController.get);
router.put('/:id', validateAuthToken, hasRequiredRole(['ADMIN']), validateRole, RoleController.update);

export { router as roleRoutes };
