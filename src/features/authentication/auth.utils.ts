import bcrypt from 'bcryptjs';
import config from 'config';
import { verify } from 'jsonwebtoken';
import { Client } from 'ldapts';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

const LDAPS_URL = config.get<string>('ldapsUrl');

const ldapConfig = {
  url: LDAPS_URL ?? '',
  timeout: 0,
  connectTimeout: 0,
  tlsOptions: {
    minVersion: 'TLSv1.2' as const,
  },
};

type DecodedTokenType = { id: string; email: string };

const DC = 'mfb';

export const authenticateLDAPS = async (username: string, password: string) => {
  const client = new Client(ldapConfig);

  try {
    const userDN = `uid=${username},dc=${DC},dc=com`;
    await client.bind(userDN, password);
    return true;
  } catch (error) {
    logger.error(`Authentication failed for user: ${username}. ${error}`);
    return false;
  } finally {
    await client.unbind();
  }
};

export class AuthUtil {
  private static readonly handleTokenVerificationError = (error) => {
    if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthenticated('Invalid token provided');
    }
    if (error.name === 'TokenExpiredError') {
      error = ApiError.forbidden('Token expired');
    }
    if (error.name === 'ApiError') {
      logger.error(`Decoding token failed. ${error.message}`);
    } else {
      logger.error('Decoding token failed.');
    }
    throw error;
  };

  static readonly decodeJwt = (token: string): DecodedTokenType | null => {
    try {
      const decodePayload = verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as DecodedTokenType;
      logger.debug('Decoding token successful.');

      return decodePayload;
    } catch (error) {
      this.handleTokenVerificationError(error);
      return null;
    }
  };

  static readonly hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 8);
  };
}
