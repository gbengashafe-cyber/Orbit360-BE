import { db } from './src/db';
import { Department } from './src/features/department/department.model';

async function create() {
  try {
    await db.authenticate();
    
    const departments = await Department.bulkCreate([
      { name: 'INFORMATION TECHNOLOGY', companyId: 1 },
      { name: 'BRANCH OPERATIONS', companyId: 1 },
      { name: 'INTERNAL CONTROL', companyId: 1 },
      { name: 'AUDIT', companyId: 1 },
      { name: 'MARKETING', companyId: 1 },
      { name: 'SECURITY', companyId: 1 },
    ]);
    
    console.log('Departments created:');
    console.log(JSON.stringify(departments.map(d => ({ id: d.id, name: d.name })), null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

create();
