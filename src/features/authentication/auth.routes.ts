import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

// Google OAuth callback
router.post('/google/callback', AuthController.googleCallback);

// Get current user
router.get('/me', AuthController.getCurrentUser);

// Logout
router.post('/logout', AuthController.logout);

export default router;
