import { JobRole } from '../features/job-role/job-role.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { db } from './index';

async function seedAdminPermissions() {
  try {
    await db.authenticate();
    console.log('Connected to database');

    // All available permissions
    const allPermissions = [
      'manage_employees',
      'manage_users',
      'manage_roles',
      'manage_permissions',
      'manage_departments',
      'manage_payroll',
      'manage_leave',
      'manage_loans',
      'manage_recruitment',
      'manage_onboarding',
      'manage_performance',
      'manage_complaints',
      'view_reports',
      'approve_leave',
      'approve_loans',
      'approve_recruitment',
      'approve_exits',
      'view_all_data',
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
