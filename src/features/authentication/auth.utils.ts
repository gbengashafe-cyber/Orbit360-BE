import { Client } from 'ldapts';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const ldapConfig = {
  url: env.LDAPS_URL ?? '',
  timeout: 0,
  connectTimeout: 0,
  tlsOptions: {
    minVersion: 'TLSv1.2' as const,
  },
};

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
