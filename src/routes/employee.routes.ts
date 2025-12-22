import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { validateCreateEmployee, validateUpdateEmployee } from "../features/employee/employee.validators";

const router = Router();

router.get('/', EmployeeController.getAll);
router.get('/:id', EmployeeController.getById);
router.post('/', validateCreateEmployee, EmployeeController.create);
router.put('/:id', validateUpdateEmployee, EmployeeController.update);
router.delete('/:id', EmployeeController.delete);

export default router;
