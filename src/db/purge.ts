import { db } from '.';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { loadModels } from './loadModels';

const drop = async () => {
  try {
    await db.drop();
    logger.info('Database tables deleted');

    process.exit(0);
  } catch (error) {
    console.error('Error deleting database tables:', error);
    process.exit(1);
  }
};

if (env.NODE_ENV !== 'production') {
  loadModels();
  drop();
}
