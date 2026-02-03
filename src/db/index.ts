import { Dialect, Sequelize } from 'sequelize';
import { env } from '../env';
import { logger } from '../utils/logger';

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST_NAME, DB_TYPE, DB_PORT } = env;

const db = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST_NAME,
  port: DB_PORT,
  dialect: DB_TYPE as Dialect,
  pool: {
    max: 5,
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  },
  dialectOptions: {
    decimalNumbers: true,
  },

  logging: (msg) => (env.NODE_ENV === 'production' ? logger.debug(msg) : logger.info(msg)),
});

db.authenticate()
  .then(() => {})
  .catch((error) => {
    logger.error(`Test DB connection failed. Error: ${error.name} - ${error.message}`);
    logger.debug(
      `Test DB connection failed. Host: ${db.config.host}, Port: ${db.config.port}, DatabaseName: ${db.config.database}`,
    );
  });

export { db };
