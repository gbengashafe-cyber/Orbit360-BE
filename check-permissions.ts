import { JobRoleRepository } from './src/features/job-role/job-role.repository';
import { db } from './src/db';

async function checkPermissions() {
  try {
    console.log('Checking permissions for HR Operations role (ID: 3)...');
    const perms = await JobRoleRepository.getJobRolePermissions(3);
    console.log('Permissions:', perms);

    console.log('\nChecking permissions for HR Manager role (ID: 4)...');
    const perms2 = await JobRoleRepository.getJobRolePermissions(4);
    console.log('Permissions:', perms2);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPermissions();
