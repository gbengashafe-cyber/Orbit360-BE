import config from 'config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import generator from 'generate-password';
import { Client } from 'ldapts';
import owasp from 'owasp-password-strength-test';
import { logger } from '../../utils/logger';

owasp.config({
  minLength: 12,
  maxLength: 128,
  minOptionalTestsToPass: 4,
});

const LDAPS_URL = config.get<string>('ldapsUrl');

const ldapConfig = {
  url: LDAPS_URL,
  timeout: 0,
  connectTimeout: 0,
  tlsOptions: {
    minVersion: 'TLSv1.2' as const,
  },
};

export const TOKEN_FINGERPRINT_COOKIE_NAME = '__Orbit360-Secure-Fgp';
export const REFRESH_TOKEN_COOKIE_NAME = '__Orbit360-Refresh-Token';

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
  static readonly hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 8);
  };

  static readonly generatePassword = () => {
    return generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
      excludeSimilarCharacters: true,
    });
  };

  static readonly validate = (password: string) => {
    return owasp.test(password);
  };

  static readonly generateUserContext = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  static readonly hashUserContext = (value: string) => {
    return crypto.createHash('sha256').update(value).digest('hex');
  };
}
