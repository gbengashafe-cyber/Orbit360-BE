import { Router } from 'express';
import { JobRoleController } from './job-role.controller';
import { validateJobRole, validateUpdateJobRole } from './job-role.validators';

const router = Router();

router.get('/', JobRoleController.getAll);
router.get('/:id', JobRoleController.getById);
router.post('/', validateJobRole, JobRoleController.create);
router.put('/:id', validateUpdateJobRole, JobRoleController.update);
router.delete('/:id', JobRoleController.delete);

export { router as jobRoleRoutes };
