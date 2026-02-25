import { db } from './src/db';
import { User } from './src/features/users/user.model';
import { JobRolePermissions } from './src/features/permissions/permission.model';

async function checkPermissions() {
  try {
    const user = await User.findOne({
      where: { email: 'test-hr-manager@gmail.com' }
    });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`User: ${user.email}, JobRoleId: ${user.jobRoleId}`);

    const permissions = await JobRolePermissions.findAll({
      where: { jobRoleId: user.jobRoleId },
      attributes: ['permission']
    });

    console.log(`Job role ${user.jobRoleId} has permissions:`);
    permissions.forEach(p => {
      console.log(`  - ${p.permission}`);
    });

    const hasApprovalPermission = permissions.some(p => p.permission === 'APPROVE_DOCUMENT_DELETION');
    console.log(`\nHas APPROVE_DOCUMENT_DELETION: ${hasApprovalPermission}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPermissions();
