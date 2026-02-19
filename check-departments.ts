import { db } from './src/db';
import { Department } from './src/features/department/department.model';

async function check() {
  try {
    await db.authenticate();
    const departments = await Department.findAll();
    console.log('Departments in database:');
    console.log(JSON.stringify(departments.map(d => ({ id: d.id, name: d.name })), null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
