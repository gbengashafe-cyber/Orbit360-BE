import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from './utils/logger';

dotenv.config();

const envSchema = z.object({
  PORT: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['info', 'error', 'debug']).default('info'),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST_NAME: z.string(),
  DB_PORT: z.coerce.number(),
  DB_TYPE: z.string(),
  NODE_CONFIG_DIR: z.string().default('src/config'),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

  logger.debug(`Invalid environment variables: ${errors}`);

  process.exit(1);
}

export const env = result.data;
