import { JobRole } from '../features/job-role/job-role.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { db } from './index';

async function seedAdminPermissions() {
  try {
    await db.authenticate();
    console.log('Connected to database');

    // All available permissions
    const allPermissions = [
      'LIST_EMPLOYEES',
      'MANAGE_EMPLOYEES',
      'APPROVE_EMPLOYEES',
      'MANAGE_EXITS',
      'APPROVE_EXITS',
      'LIST_LOANS',
      'MANAGE_LOANS',
      'APPROVE_LOANS',
      'MANAGE_RECRUITMENT',
      'APPROVE_RECRUITMENT',
      'MANAGE_ONBOARDING',
      'LIST_PAYROLLS',
      'MANAGE_PAYROLLS',
      'APPROVE_PAYROLL_OVERRIDE',
      'MANAGE_USERS',
      'MANAGE_DOCUMENTS',
      'APPROVE_DOCUMENT_DELETION',
    ];

    // Get all existing job roles from database
    const existingRoles = await JobRole.findAll();
    const existingRoleTitles = existingRoles.map((r) => r.id);

    console.log('Existing job roles:', existingRoleTitles);

    for (const roleName of existingRoleTitles) {
      for (const perm of allPermissions) {
        await JobRolePermissions.findOrCreate({
          where: { jobRoleId: roleName, permission: perm },
          defaults: { jobRoleId: roleName, permission: perm },
        });
      }
      console.log(`✅ Permissions assigned to ${roleName}`);
    }

    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedAdminPermissions();
