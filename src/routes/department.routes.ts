import { Router } from 'express';
import { DepartmentController } from '../features/department/department.controller';
import { validateCreateDepartment, validateUpdateDepartment } from "./department.validators";

const router = Router();

router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);
router.post('/', validateCreateDepartment, DepartmentController.create);
router.put('/:id', validateUpdateDepartment, DepartmentController.update);
router.delete('/:id', DepartmentController.delete);

export default router;  
