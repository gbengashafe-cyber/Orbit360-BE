import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { JobRole } from '../features/job-role/job-role.model';
import { User } from '../features/users/user.model';
import { db } from './index';

async function seedUser() {
  try {
    await db.authenticate();
    console.log('Connected to database');

    // 1. Create company
    const company = await Company.findOrCreate({
      where: { name: 'Test Company' },
      defaults: { name: 'Test Company', createdBy: 'system' },
    });
    console.log('Company created/found:', company[0].dataValues);

    // 2. Create department
    const department = await Department.findOrCreate({
      where: { name: 'General' },
      defaults: { name: 'General', companyId: company[0].id },
    });
    console.log('Department created/found:', department[0].dataValues);

    // 3. Create job role
    const jobRole = await JobRole.findOrCreate({
      where: { title: 'Admin' },
      defaults: { title: 'Admin' },
    });
    console.log('Job Role created/found:', jobRole[0].dataValues);

    // 4. Create user
    const user = await User.findOrCreate({
      where: { email: 'o@o.com' },
      defaults: {
        email: 'o@o.com',
        password: '',
        firstName: 'Zoe',
        lastName: 'Zebedee',
        role: 'admin',
        jobRole: 'Admin',
        departmentName: 'General',
        status: 'ACTIVE',
      },
    });

    console.log('✅ User created/found:', user[0].dataValues);
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedUser();
