import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { JobRole } from '../features/job-role/job-role.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    const companies = await Company.findOne();

    await Department.bulkCreate(
      [
        { name: 'Information Technology', description: '', companyId: companies?.id },
        { name: 'Branch Operations', description: '', companyId: companies?.id },
        { name: 'Internal Control', description: '', companyId: companies?.id },
        { name: 'Audit', description: '', companyId: companies?.id },
        { name: 'Marketing', description: '', companyId: companies?.id },
        { name: 'Security', description: '', companyId: companies?.id },
      ],
      { ignoreDuplicates: true },
    );
    logger.info('Departments created');

    await JobRole.bulkCreate(
      [
        { title: 'Senior Developer', description: '' },
        { title: 'Junior Developer', description: '' },
        { title: 'Sales Manager', description: '' },
        { title: 'HR Manager', description: '' },
        { title: 'HR Operations', description: '' },
      ],
      { ignoreDuplicates: true },
    );

    await JobRolePermissions.bulkCreate(
      [
        { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR Operations' },
        { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR Manager' },
        { permission: 'MANAGE_ONBOARDING', jobRole: 'HR Operations' },
        { permission: 'MANAGE_LOANS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_USERS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_PAYROLLS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_LOANS', jobRole: 'HR Manager' },
        { permission: 'APPROVE_LOANS', jobRole: 'HR Manager' },
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
