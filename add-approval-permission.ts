import { db } from './src/db';
import { User } from './src/features/users/user.model';
import { JobRolePermissions } from './src/features/permissions/permission.model';

async function addApprovalPermission() {
  try {
    // Find your user (HR Manager)
    const user = await User.findOne({
      where: { email: 'test-hr-manager@gmail.com' }
    });

    if (!user) {
      console.log('User not found. Please check your email.');
      process.exit(1);
    }

    console.log(`Found user: ${user.email} with jobRoleId: ${user.jobRoleId}`);

    // Check if permission already exists
    const existingPermission = await JobRolePermissions.findOne({
      where: {
        jobRoleId: user.jobRoleId,
        permission: 'APPROVE_DOCUMENT_DELETION'
      }
    });

    if (existingPermission) {
      console.log('Job role already has APPROVE_DOCUMENT_DELETION permission');
      process.exit(0);
    }

    // Add the permission
    await JobRolePermissions.create({
      jobRoleId: user.jobRoleId,
      permission: 'APPROVE_DOCUMENT_DELETION'
    });

    console.log(`✓ Added APPROVE_DOCUMENT_DELETION permission to job role ${user.jobRoleId}`);
    console.log('Please log out and log back in to refresh your permissions.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addApprovalPermission();
