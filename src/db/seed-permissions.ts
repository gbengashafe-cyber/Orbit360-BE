import { db } from '.';
import { JobRolePermissions, Permission } from '../features/permissions/permission.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await db.sync({ alter: true });

    await Permission.bulkCreate([{ name: 'MANAGE_EMPLOYEES' }]);
    await JobRolePermissions.bulkCreate([{ permission: 'MANAGE_EMPLOYEES', jobRole: 'HR_OPERATIONS' }]);

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
