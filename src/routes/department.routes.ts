import { Router } from 'express';
import { DepartmentController } from '../features/department/department.controller';

const router = Router();

router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);
router.post('/', DepartmentController.create);
router.put('/:id', DepartmentController.update);
router.delete('/:id', DepartmentController.delete);

export default router;
