import { db } from '.';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { loadModels } from './loadModels';

if (env.NODE_ENV.toUpperCase() !== 'PRODUCTION') {
  loadModels();

  (async () => {
    try {
      // Disable foreign key checks
      await db.query('SET FOREIGN_KEY_CHECKS = 0');

      // Sync with force
      await db.sync({ force: true });

      // Re-enable foreign key checks
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      logger.info('DB Sync was successful');
      process.exit(0);
    } catch (error) {
      logger.error('Unable to complete DB sync.');
      logger.error(error);
      process.exit(0);
    }
  })();
}
