import { db } from './src/db';
import { JobRolePermissions } from './src/features/permissions/permission.model';
import { JobRole } from './src/features/job-role/job-role.model';

async function assignRecruitmentPermissions() {
  try {
    console.log('Assigning recruitment permissions...');
    await db.authenticate();
    console.log('✓ Database connected');

    // Find HR, HR Manager, and HR Operations roles
    const roles = await JobRole.findAll({ 
      where: { 
        title: ['HR', 'HR MANAGER', 'HR OPERATIONS'] 
      } 
    });

    if (roles.length === 0) {
      console.error('No HR roles found');
      process.exit(1);
    }

    console.log(`Found ${roles.length} role(s): ${roles.map(r => r.title).join(', ')}`);

    // Permissions to assign
    const permissions = ['MANAGE_RECRUITMENT', 'APPROVE_RECRUITMENT', 'APPROVE_EXITS'];

    for (const role of roles) {
      for (const permission of permissions) {
        await JobRolePermissions.findOrCreate({
          where: { jobRoleId: role.id, permission },
          defaults: { jobRoleId: role.id, permission },
        });
        console.log(`✓ Assigned ${permission} to ${role.title}`);
      }
    }

    console.log('✓ All permissions assigned successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignRecruitmentPermissions();
