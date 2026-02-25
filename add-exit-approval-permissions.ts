import { db } from './src/db';
import { User } from './src/features/users/user.model';
import { JobRolePermissions } from './src/features/permissions/permission.model';

async function addExitApprovalPermissions() {
  try {
    const hrUsers = [
      'test-hr@gmail.com',
      'test-hr-manager@gmail.com'
    ];

    for (const email of hrUsers) {
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        console.log(`User ${email} not found, skipping...`);
        continue;
      }

      console.log(`Found user: ${user.email} with jobRoleId: ${user.jobRoleId}`);

      // Check if permission already exists
      const existingPermission = await JobRolePermissions.findOne({
        where: {
          jobRoleId: user.jobRoleId,
          permission: 'APPROVE_EXITS'
        }
      });

      if (existingPermission) {
        console.log(`${email} already has APPROVE_EXITS permission`);
        continue;
      }

      // Add the permission
      await JobRolePermissions.create({
        jobRoleId: user.jobRoleId,
        permission: 'APPROVE_EXITS'
      });

      console.log(`✓ Added APPROVE_EXITS permission to ${email}`);
    }

    console.log('Done! Please log out and log back in to refresh permissions.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addExitApprovalPermissions();
