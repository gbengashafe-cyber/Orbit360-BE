import { JobRole } from '../features/job-role/job-role.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    // Create job roles first
    await JobRole.bulkCreate(
      [
        { title: 'HR_OPERATIONS', description: 'HR Operations Manager' },
        { title: 'ADMIN', description: 'Administrator' },
        { title: 'EMPLOYEE', description: 'Employee' },
      ],
      { ignoreDuplicates: true },
    );

    // Create role-permission mappings
    await JobRolePermissions.bulkCreate(
      [
        { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR_OPERATIONS' },
        { permission: 'MANAGE_ONBOARDING', jobRole: 'HR_OPERATIONS' },
        { permission: 'MANAGE_LOANS', jobRole: 'HR_OPERATIONS' },
        { permission: 'MANAGE_USERS', jobRole: 'HR_OPERATIONS' },
        { permission: 'MANAGE_PAYROLLS', jobRole: 'HR_OPERATIONS' },
      ],
      { ignoreDuplicates: true },
    );

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
