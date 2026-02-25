import { db } from './src/db';
import { JobRolePermissions } from './src/features/permissions/permission.model';
import { JobRole } from './src/features/job-role/job-role.model';

async function assignRecruitmentPermissions() {
  try {
    console.log('Assigning recruitment permissions...');
    await db.authenticate();
    console.log('✓ Database connected');

    // Find HR Manager role
    const hrManagerRole = await JobRole.findOne({ where: { title: 'HR MANAGER' } });
    if (!hrManagerRole) {
      console.error('HR MANAGER role not found');
      process.exit(1);
    }

    console.log(`Found HR Manager role: ${hrManagerRole.id}`);

    // Permissions to assign
    const permissions = ['MANAGE_RECRUITMENT', 'APPROVE_RECRUITMENT', 'APPROVE_EXITS'];

    for (const permission of permissions) {
      await JobRolePermissions.findOrCreate({
        where: { jobRoleId: hrManagerRole.id, permission },
        defaults: { jobRoleId: hrManagerRole.id, permission },
      });
      console.log(`✓ Assigned ${permission} to HR MANAGER`);
    }

    console.log('✓ All permissions assigned successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignRecruitmentPermissions();
