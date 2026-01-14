import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { User } from '../users/user.model';

export class AuthController {
  // Google OAuth callback
  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { googleId, email, firstName, lastName, profileImage, role } = req.body;

      let user = await User.findOne({ where: { googleId } });

      if (!user) {
        user = await User.create({
          googleId,
          email,
          firstName,
          lastName,
          profileImage,
          role: 'employee',
          status: 'active',
          jobRole: 'employee',
          department: 'employee',
          password: '',
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            role: user.role,
          },
          token,
        },
        message: 'Logged in successfully',
      });
    } catch (error) {
      logger.error(`Error in Google callback: ${error}`);
      next(error);
    }
  }

  // Get current user
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId; // Set by auth middleware

      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'firstName', 'lastName', 'profileImage', 'role'],
      });

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.json({ data: user });
    } catch (error) {
      logger.error(`Error fetching user: ${error}`);
      next(error);
    }
  }

  // Logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error(`Error during logout: ${error}`);
      next(error);
    }
  }
}
