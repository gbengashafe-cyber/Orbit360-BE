import { db } from '.';
import { env } from '../env';
import { logger } from '../utils/logger';
import { loadModels } from './loadModels';

if (env.NODE_ENV.toUpperCase() !== 'PRODUCTION') {
  loadModels();
  db.sync({ alter: true })
    .then(() => {
      logger.info('DB Sync was successful');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unable to complete DB sync.');
      logger.error(error);
      process.exit(0);
    });
}
