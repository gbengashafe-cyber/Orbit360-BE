import { Sequelize } from 'sequelize';
import { env } from './src/config/env';
import { logger } from './src/utils/logger';

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST_NAME, DB_TYPE, DB_PORT } = env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST_NAME,
  port: DB_PORT,
  dialect: DB_TYPE as any,
  logging: false,
});

async function runMigration() {
  try {
    console.log('Running asset_return_status migration...');
    await sequelize.authenticate();
    console.log('✓ Database connected');
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE exits ADD COLUMN asset_return_status ENUM('not_applicable', 'pending_return', 'returned', 'not_returned') 
      DEFAULT 'pending_return' AFTER assets_to_return
    `);
    
    console.log('✓ Migration completed successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    if (error.message && error.message.includes('Duplicate column')) {
      console.log('✓ Column already exists, skipping...');
      await sequelize.close();
      process.exit(0);
    }
    console.error('✗ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
