import { Router } from 'express';
import { validateAuthToken } from '../../features/authentication/auth.middleware';
import { isAdmin } from '../../utils/check-permission';
import { RoleController } from './role.controller';
import { validateRole } from './role.validation';

const router = Router();

router.use([validateAuthToken]);

router.get('/', RoleController.get);
router.get('/:id', RoleController.getById);

router.use(isAdmin);

router.post('/', validateRole, RoleController.create);
router.put('/:id', validateRole, RoleController.update);

export { router as roleRoutes };
