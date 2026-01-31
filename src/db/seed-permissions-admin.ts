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
      'view_all_data',
    ];

    // Assign all permissions to Admin role
    for (const perm of allPermissions) {
      await JobRolePermissions.findOrCreate({
        where: { jobRole: 'Admin', permission: perm },
        defaults: { jobRole: 'Admin', permission: perm },
      });
    }

    console.log('✅ Admin role permissions assigned');
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedAdminPermissions();
