import { db } from './src/db';
import { User } from './src/features/users/user.model';
import { JobRolePermissions } from './src/features/permissions/permission.model';

async function addSupervisorApprovalPermissions() {
  try {
    const supervisorUser = await User.findOne({
      where: { email: 'test-supervisor@gmail.com' }
    });

    if (!supervisorUser) {
      console.log('Supervisor user not found');
      process.exit(1);
    }

    console.log(`Found supervisor: ${supervisorUser.email} with jobRoleId: ${supervisorUser.jobRoleId}`);

    const permissions = ['APPROVE_EXITS'];

    for (const permission of permissions) {
      // Check if permission already exists
      const existingPermission = await JobRolePermissions.findOne({
        where: {
          jobRoleId: supervisorUser.jobRoleId,
          permission
        }
      });

      if (existingPermission) {
        console.log(`Supervisor already has ${permission} permission`);
        continue;
      }

      // Add the permission
      await JobRolePermissions.create({
        jobRoleId: supervisorUser.jobRoleId,
        permission
      });

      console.log(`✓ Added ${permission} permission to supervisor`);
    }

    console.log('Done! Please log out and log back in to refresh permissions.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addSupervisorApprovalPermissions();
