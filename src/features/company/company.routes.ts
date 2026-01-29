import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { CompanyController } from './company.controller';
import { validateCreateCompany, validateUpdateCompany } from './company.validators';

const router = Router();

router.use([validateAuthToken, hasRequiredPermission('ADMIN')]);

router.post('/', validateCreateCompany, CompanyController.create);
router.get('/:id', CompanyController.getById);
router.get('/', CompanyController.get);
router.put('/:id', validateUpdateCompany, CompanyController.update);
router.delete('/:id', CompanyController.delete);

export { router as companyRoutes };
