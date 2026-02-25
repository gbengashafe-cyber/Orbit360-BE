import { db } from './src/db';
import { User } from './src/features/users/user.model';

async function listUsers() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'jobRoleId', 'departmentId'],
      limit: 20
    });

    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}, JobRoleId: ${user.jobRoleId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
