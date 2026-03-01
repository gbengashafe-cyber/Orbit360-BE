import { Router } from 'express';
import { isAdmin } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { CompanyController } from './company.controller';
import { validateCreateCompany, validateUpdateCompany } from './company.validators';

const router = Router();

router.use(validateAuthToken);

router.get('/:companyId/departments', CompanyController.getDepartments);
router.get('/:id', CompanyController.getById);
router.get('/', CompanyController.get);

router.use(isAdmin);

router.post('/', validateCreateCompany, CompanyController.create);
router.put('/:id', validateUpdateCompany, CompanyController.update);
router.delete('/:id', CompanyController.delete);

export { router as companyRoutes };
