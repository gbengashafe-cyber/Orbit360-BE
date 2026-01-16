import { Router } from 'express';
import { hasRequiredPermission } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { CompanyController } from './company.controller';
import { validateCreateCompany, validateUpdateCompany } from './company.validators';

const router = Router();

router.post('/', validateAuthToken, hasRequiredPermission('ADMIN'), validateCreateCompany, CompanyController.create);
router.get('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), CompanyController.getById);
router.get('/', validateAuthToken, hasRequiredPermission('ADMIN'), CompanyController.get);
router.put('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), validateUpdateCompany, CompanyController.update);
router.delete('/:id', validateAuthToken, hasRequiredPermission('ADMIN'), CompanyController.delete);

export { router as companyRoutes };
