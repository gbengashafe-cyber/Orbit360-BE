import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { generateToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { User } from '../users/user.model';
import { UserRepository } from '../users/user.repository';
import { authenticateLDAPS } from './auth.utils';

export class AuthController {
  static readonly ldapLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const isAuthenticated = await authenticateLDAPS(email, password);

    if (!isAuthenticated) {
      throw ApiError.unauthenticated('AD Authentication failed');
    }

    // Get user's details
    const userRecord = await UserRepository.readByEmail(email);

    if (!userRecord) {
      throw ApiError.unauthenticated('Authentication failed');
    }

    const token = generateToken({
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
    });

    res.json(
      ApiResponse({
        data: {
          user: userRecord,
          token,
        },
        message: 'Logged in successfully',
      }),
    );
  };
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
          role,
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

      res.json(
        ApiResponse({
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
        }),
      );
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

      res.json(ApiResponse({ data: user, message: 'Fetched current user successfully' }));
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
