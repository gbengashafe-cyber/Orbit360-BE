import { Router } from 'express';
import { AuthController } from './auth.controller';
import { isActive, validateAuthToken } from './auth.middleware';

const router = Router();

// Google OAuth callback
router.post('/google/callback', AuthController.googleCallback);

// Get current user
router.get('/me', validateAuthToken, isActive, AuthController.getCurrentUser);

// Logout
router.post('/logout', AuthController.logout);
router.post('/user', AuthController.ldapLogin);
router.post('/login', AuthController.passwordLogin);
router.post('/refresh', isActive, AuthController.refreshToken);

export { router as authRoutes };
