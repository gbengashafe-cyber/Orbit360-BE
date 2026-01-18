import { Router } from 'express';
import { hasRequiredPermission, isInAllowedDepartment } from '../../utils/check-permission';
import { validateAuthToken } from '../authentication/auth.middleware';
import { OnboardingController } from './onboarding.controller';
import {
  validateCreateOnboarding,
  validateEmployeeIdParam,
  validateOnboardingIdParam,
  validateUpdateOnboarding,
} from './onboarding.validators';

const router = Router();

router.post(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_ONBOARDING'),
  validateCreateOnboarding,
  OnboardingController.create,
);
router.get(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_ONBOARDING'),
  OnboardingController.getAll,
);
router.get('/employee/:employeeId', validateAuthToken, validateEmployeeIdParam, OnboardingController.getByEmployee);
router.get('/:id', validateAuthToken, validateOnboardingIdParam, OnboardingController.getById);
router.patch(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_ONBOARDING'),
  validateOnboardingIdParam,
  validateUpdateOnboarding,
  OnboardingController.update,
);
router.delete(
  '/:id',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_ONBOARDING'),
  validateOnboardingIdParam,
  OnboardingController.delete,
);

export { router as onboardingRoutes };
