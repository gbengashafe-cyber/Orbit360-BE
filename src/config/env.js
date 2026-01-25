'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.env = void 0;
var dotenv_1 = require('dotenv');
var zod_1 = require('zod');
var logger_1 = require('../utils/logger');
dotenv_1.default.config();
var envSchema = zod_1.z.object({
  PORT: zod_1.z.string(),
  NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: zod_1.z.enum(['info', 'error', 'debug']).default('info'),
  DB_NAME: zod_1.z.string(),
  DB_USER: zod_1.z.string(),
  DB_PASSWORD: zod_1.z.string(),
  DB_HOST_NAME: zod_1.z.string(),
  DB_PORT: zod_1.z.coerce.number(),
  DB_TYPE: zod_1.z.string(),
  NODE_CONFIG_DIR: zod_1.z.string().default('src/config'),
  JWT_SECRET: zod_1.z.string(),
  GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
  GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
});
var result = envSchema.safeParse(process.env);
if (!result.success) {
  var errors = result.error.issues
    .map(function (issue) {
      return ''.concat(issue.path.join('.'), ': ').concat(issue.message);
    })
    .join(', ');
  logger_1.logger.debug('Invalid environment variables: '.concat(errors));
  process.exit(1);
}
exports.env = result.data;
