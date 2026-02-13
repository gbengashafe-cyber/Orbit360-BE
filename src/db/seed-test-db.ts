import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { JobRole } from '../features/job-role/job-role.model';
import { LoanType } from '../features/loans/loan-types/loan-types.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { User } from '../features/users/user.model';
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

    await LoanType.bulkCreate(
      [
        { name: 'Thrift', interestRate: 0, maxTenureMonths: 6 },
        { name: 'Salary Advance', interestRate: 15.3, maxTenureMonths: 50 },
        { name: 'Personal', interestRate: 3, maxTenureMonths: 6 },
      ],
      { ignoreDuplicates: true },
    );

    await JobRole.bulkCreate(
      [
        { title: 'HR Operations', description: '' },
        { title: 'Senior Developer', description: '' },
        { title: 'Junior Developer', description: '' },
        { title: 'Sales Manager', description: '' },
        { title: 'HR Manager', description: '' },
      ],
      { ignoreDuplicates: true },
    );

    const hrOperationsRole = await JobRole.findOne({ where: { title: 'HR Operations' } });

    await User.update({ jobRole: hrOperationsRole?.title }, { where: { email: 'test@gmail.com' } });

    await JobRolePermissions.truncate();

    await JobRolePermissions.bulkCreate(
      [
        { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR Operations' },
        { permission: 'MANAGE_ONBOARDING', jobRole: 'HR Operations' },
        { permission: 'MANAGE_USERS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_PAYROLLS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_LOANS', jobRole: 'HR Operations' },
        { permission: 'LIST_LOANS', jobRole: 'HR Operations' },
        { permission: 'LIST_LOANS', jobRole: 'HR Manager' },
        { permission: 'LIST_EMPLOYEES', jobRole: 'HR Operations' },
        { permission: 'LIST_EMPLOYEES', jobRole: 'HR Manager' },
        { permission: 'APPROVE_LOANS', jobRole: 'HR Manager' },
        { permission: 'APPROVE_PAYROLLS', jobRole: 'HR Manager' },
        { permission: 'APPROVE_EMPLOYEES', jobRole: 'HR Manager' },
        { permission: 'LIST_PAYROLLS', jobRole: 'HR Manager' },
        { permission: 'LIST_PAYROLLS', jobRole: 'HR Operations' },
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
