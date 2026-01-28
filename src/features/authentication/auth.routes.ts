import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateAuthToken } from './auth.middleware';

const router = Router();

// Google OAuth callback
router.post('/google/callback', AuthController.googleCallback);

// Get current user
router.get('/me', validateAuthToken, AuthController.getCurrentUser);

// Logout
router.post('/logout', AuthController.logout);
router.post('/user', AuthController.ldapLogin);
router.post('/login', AuthController.passwordLogin);
router.post('/refresh', AuthController.refreshToken);

export { router as authRoutes };
