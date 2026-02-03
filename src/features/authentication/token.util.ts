import config from 'config';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

type TokenPayload = {
  sub: string;
  ctx: string;
  iat: number;
  exp: number;
};

export type RefreshTokenPayload = TokenPayload & {
  rid: string;
};

export const JWT_EXPIRY = config.get('tokenExpiry.access') as number;
export const REFRESH_TOKEN_EXPIRY = config.get('tokenExpiry.refresh') as number;

export class TokenUtil {
  private static readonly handleTokenVerificationError = (error) => {
    if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthenticated('Invalid token provided');
    }
    if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthenticated('Token expired');
    }
    if (error.name === 'ApiError') {
      logger.error(`Decoding token failed. ${error.message}`);
    } else {
      logger.error('Decoding token failed.');
    }
    throw error;
  };

  static readonly generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
  };

  static readonly generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  };

  static readonly decodeToken = (token: string): TokenPayload | RefreshTokenPayload | null => {
    try {
      const decodePayload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      });

      if (typeof decodePayload === 'object') {
        if ('rid' in decodePayload) {
          return decodePayload as RefreshTokenPayload;
        }
        return decodePayload as TokenPayload;
      }
      return null;
    } catch (error) {
      this.handleTokenVerificationError(error);
      return null;
    }
  };
}
