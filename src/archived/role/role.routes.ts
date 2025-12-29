import { Router } from 'express';
import { validateAuthToken } from '../../features/authentication/auth.middleware';
import { hasRequiredPermission } from '../../utils/check-permission';
import { RoleController } from './role.controller';
import { validateRole } from './role.validation';

const router = Router();

router.post('/', validateAuthToken, hasRequiredPermission('ADMIN'), validateRole, RoleController.create);
router.get('/', validateAuthToken, hasRequiredPermission('ADMIN'), RoleController.get);
router.get('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), RoleController.getById);
router.put('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), validateRole, RoleController.update);

export { router as roleRoutes };
