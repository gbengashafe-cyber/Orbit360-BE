import { db } from './src/db';
import { User } from './src/features/users/user.model';
import { JobRolePermissions } from './src/features/permissions/permission.model';

async function addOnboardingPermission() {
  try {
    const user = await User.findOne({
      where: { email: 'test-hr-manager@gmail.com' }
    });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`Found user: ${user.email} with jobRoleId: ${user.jobRoleId}`);

    // Check if MANAGE_ONBOARDING permission already exists
    const existingPermission = await JobRolePermissions.findOne({
      where: {
        jobRoleId: user.jobRoleId,
        permission: 'MANAGE_ONBOARDING'
      }
    });

    if (existingPermission) {
      console.log('Job role already has MANAGE_ONBOARDING permission');
      process.exit(0);
    }

    // Add the permission
    await JobRolePermissions.create({
      jobRoleId: user.jobRoleId,
      permission: 'MANAGE_ONBOARDING'
    });

    console.log(`✓ Added MANAGE_ONBOARDING permission to job role ${user.jobRoleId}`);
    console.log('Please log out and log back in to refresh your permissions.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addOnboardingPermission();
