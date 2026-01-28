import { NextFunction, Request, Response } from 'express';
import { InferAttributes } from 'sequelize';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { User } from '../users/user.model';
import { UserRepository } from '../users/user.repository';
import { AuthRepository } from './auth.repository';
import { authenticateLDAPS, AuthUtil, REFRESH_TOKEN_COOKIE_NAME, TOKEN_FINGERPRINT_COOKIE_NAME } from './auth.utils';
import { RefreshTokenRepository } from './refresh-token.repository';
import { REFRESH_TOKEN_EXPIRY, TokenUtil } from './token.util';

export class AuthController {
  private static async handleUserLogin({
    res,
    user,
    updateLastLoginDate = false,
  }: {
    res: Response;
    user: Omit<InferAttributes<User>, 'password'>;
    updateLastLoginDate?: boolean;
  }) {
    const userContext = AuthUtil.generateUserContext();
    const userContextHash = AuthUtil.hashUserContext(userContext);

    const accessToken = TokenUtil.generateToken({
      sub: String(user.id),
      ctx: userContextHash,
    });

    const refreshTokenId = crypto.randomUUID();
    const refreshToken = TokenUtil.generateRefreshToken({
      sub: String(user.id),
      ctx: userContextHash,
      rid: refreshTokenId,
    });

    await RefreshTokenRepository.save({
      id: refreshTokenId,
      userId: user.id,
      contextHash: userContextHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
    });

    if (updateLastLoginDate) {
      await UserRepository.update(user.id, { lastLoginDate: new Date() });
    }

    res.cookie(TOKEN_FINGERPRINT_COOKIE_NAME, userContext, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      path: '/',
    });

    return res.json(
      ApiResponse({
        message: 'Login successful',
        data: { accessToken },
      }),
    );
  }

  static readonly ldapLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const isAuthenticated = await authenticateLDAPS(email, password);

    if (!isAuthenticated) {
      throw ApiError.unauthenticated('AD Authentication failed');
    }

    const userRecord = await UserRepository.readByEmail(email);

    if (!userRecord) {
      throw ApiError.unauthenticated('Authentication failed');
    }

    await this.handleUserLogin({ res, user: userRecord, updateLastLoginDate: true });
  };

  // Google OAuth callback
  static async googleCallback(req: Request, res: Response) {
    const { googleId, email, firstName, lastName, profileImage, role } = req.body;

    let userRecord = await User.findOne({ where: { googleId } });

    if (!userRecord) {
      userRecord = await User.create({
        googleId,
        email,
        firstName,
        lastName,
        profileImage,
        role,
        status: 'active',
        jobRole: 'employee',
        department: 'employee',
        password: await AuthUtil.hashPassword(AuthUtil.generate()),
      });
    }

    await this.handleUserLogin({ res, user: userRecord, updateLastLoginDate: userRecord ? true : false });
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req?.user?.id;

      if (!userId) {
        throw ApiError.unauthenticated('Authentication failed');
      }

      const user = await UserRepository.readById(userId);

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.json(ApiResponse(ApiResponse({ data: user, message: 'Fetched current user successfully' })));
    } catch (error) {
      logger.error(`Error fetching user: ${error}`);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie(TOKEN_FINGERPRINT_COOKIE_NAME, {
        path: '/',
        secure: true,
        sameSite: 'strict',
      });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        path: '/',
        secure: true,
        sameSite: 'strict',
      });
      res.status(204).json(ApiResponse({ message: 'Logged out successfully', data: {} }));
    } catch (error) {
      logger.error(`Error during logout: ${error}`);
      next(error);
    }
  }

  static readonly passwordLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!(password && email)) {
      throw ApiError.unauthenticated('Email and password is required');
    }

    const user = await AuthRepository.findLoginUser(email, password);

    if (!user) {
      throw ApiError.unauthenticated('Invalid email/password');
    }

    await this.handleUserLogin({ res, user, updateLastLoginDate: true });
  };

  static readonly refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    const tokenFingerprint = req.cookies[TOKEN_FINGERPRINT_COOKIE_NAME];

    if (!refreshToken || !tokenFingerprint) {
      logger.error(`${req.requestId}: Missing refresh token or security fingerprint`);
      throw ApiError.unauthenticated('Authentication refresh failed');
    }

    const decodedToken = TokenUtil.decodeToken(refreshToken);

    if (!decodedToken || !('rid' in decodedToken)) {
      throw ApiError.unauthenticated('Invalid refresh token');
    }

    const { sub: userId, ctx, rid } = decodedToken;

    const userRecord = await UserRepository.readById(userId);

    if (!userRecord) {
      throw ApiError.unauthenticated('Authentication failed');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = userRecord;

    if (AuthUtil.hashUserContext(tokenFingerprint) !== ctx) {
      return res.sendStatus(401);
    }

    const storedRefreshToken = await RefreshTokenRepository.readById(rid);
    if (!storedRefreshToken) {
      throw ApiError.unauthenticated('Invalid refresh token');
    }
    if (storedRefreshToken.revokedAt || storedRefreshToken.expiresAt < new Date()) {
      logger.error(`${req.requestId}: SUSPICIOUS TOKEN ACTIVITY. User ID: ${userId}`);
      throw ApiError.unauthenticated('Invalid refresh token');
    }

    await RefreshTokenRepository.revoke(rid);

    await this.handleUserLogin({ res, user });
  };
}
