import { JobRolePermissions } from '../features/permissions/permission.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await JobRolePermissions.destroy({ where: { jobRole: 'HR_OPERATIONS' } });

    await JobRolePermissions.bulkCreate([
      { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR_OPERATIONS' },
      { permission: 'MANAGE_LOANS', jobRole: 'HR_OPERATIONS' },
      { permission: 'MANAGE_USERS', jobRole: 'HR_OPERATIONS' },
      { permission: 'MANAGE_PAYROLLS', jobRole: 'HR_OPERATIONS' },
    ]);

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
