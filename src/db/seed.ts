import { db } from '.';
import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { Leave } from '../features/leave/leave.model';
import { Payroll } from '../features/payroll/payroll.model';
import { Position } from '../features/position/position.model';
import { User } from '../features/users/user.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await db.sync({ alter: true });
    logger.info('Database synced');

    const companies = await Company.bulkCreate([{ name: 'MFB', description: 'Microfinance Bank', createdBy: '' }]);

    // Create Departments
    const departments = await Department.bulkCreate([
      { name: 'Engineering', description: 'Software Development', companyId: companies[0].id },
      { name: 'Human Resources', description: 'HR Department', companyId: companies[0].id },
      { name: 'Finance', description: 'Finance Department', companyId: companies[0].id },
      { name: 'Sales', description: 'Sales Department', companyId: companies[0].id },
    ]);
    logger.info('Departments created');

    // Create Positions
    const positions = await Position.bulkCreate([
      { title: 'senior_developer', description: 'Senior Software Developer' },
      { title: 'junior_developer', description: 'Junior Software Developer' },
      { title: 'hr_manager', description: 'HR Manager' },
      { title: 'sales_manager', description: 'Sales Manager' },
      { title: 'human_resources_manager', description: 'Sales Manager' },
    ]);
    logger.info('Positions created');

    // Create Employees
    const employees = await Employee.bulkCreate([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        hireDate: new Date('2023-01-15'),
        departmentName: departments[0].name,
        position: positions[0].title,
        status: 'active',
        employeeId: '1',
        dob: new Date('1990-05-15'),
        address: '123 Main St, Cityville',
        nationality: '',
        gender: 'M',
        supervisorId: '',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        hireDate: new Date('2023-03-20'),
        departmentName: departments[0].name,
        position: positions[1].title,
        status: 'active',
        employeeId: '2',
        dob: new Date('1992-08-25'),
        address: '456 Elm St, Townsville',
        nationality: '',
        gender: 'M',
        supervisorId: '',
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        hireDate: new Date('2022-06-10'),
        departmentName: departments[1].name,
        position: positions[2].title,
        status: 'active',
        employeeId: '3',
        dob: new Date('1988-11-12'),
        address: '789 Oak St, Villagetown',
        nationality: '',
        gender: 'M',
        supervisorId: '',
      },
    ]);
    logger.info('Employees created');

    // // Create Attendance Records
    // const today = new Date();
    // await Attendance.bulkCreate([
    //   {
    //     employeeId: employees[0].id,
    //     date: today,
    //     checkIn: new Date(),
    //     checkOut: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
    //     status: 'present',
    //   },
    //   {
    //     employeeId: employees[1].id,
    //     date: today,
    //     checkIn: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
    //     status: 'present',
    //   },
    // ]);
    logger.info('Attendance records created');

    // Create Leave Requests
    await Leave.bulkCreate([
      {
        employeeId: employees[0].id,
        startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
        type: 'vacation',
        status: 'pending',
        reason: 'Family vacation',
      },
    ]);
    logger.info('Leave requests created');

    // Create Payroll Records
    await Payroll.bulkCreate([
      {
        employeeId: employees[0].id,
        month: 1,
        year: 2024,
        baseSalary: 75000,
        allowances: 5000,
        deductions: 3000,
        netSalary: 77000,
        status: 'processed',
      },
      {
        employeeId: employees[1].id,
        month: 1,
        year: 2024,
        baseSalary: 65000,
        allowances: 4000,
        deductions: 2500,
        netSalary: 66500,
        status: 'paid',
      },
    ]);
    logger.info('Payroll records created');

    await User.bulkCreate([
      {
        firstName: 'oluwaseun',
        lastName: 'ABIOLA',
        email: 'o@o.com',
        department: departments[0].name,
        password: '',
        position: positions[0].title,
      },
    ]);

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
