import { Router } from 'express';
import { isAdmin } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { JobRoleController } from './job-role.controller';
import { validateJobRole, validateUpdateJobRole } from './job-role.validators';

const router = Router();

router.use(validateAuthToken);

router.get('/', JobRoleController.getAll);
router.get('/:id', JobRoleController.getById);

router.use(isAdmin);

router.post('/', validateJobRole, JobRoleController.create);
router.put('/:id', validateUpdateJobRole, JobRoleController.update);
router.delete('/:id', JobRoleController.delete);

export { router as jobRoleRoutes };
