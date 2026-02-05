import { db } from '.';
import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { JobRole } from '../features/job-role/job-role.model';
import { Leave } from '../features/leave/leave.model';
import { PayrollBatch } from '../features/payroll/payroll-batch.model';
import { Payroll } from '../features/payroll/payroll.model';
import { User } from '../features/users/user.model';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await db.sync({ alter: true });
    logger.info('Database synced');

    const companies = await Company.bulkCreate([{ name: 'MFB', description: 'Microfinance Bank', createdBy: '' }], {
      ignoreDuplicates: true,
    });

    // Create Departments
    const departments = await Department.bulkCreate(
      [
        { name: 'Engineering', description: 'Software Development', companyId: companies[0].id },
        { name: 'HR', description: 'HR Department', companyId: companies[0].id },
        { name: 'Finance', description: 'Finance Department', companyId: companies[0].id },
        { name: 'Sales', description: 'Sales Department', companyId: companies[0].id },
      ],
      { ignoreDuplicates: true },
    );
    logger.info('Departments created');

    // Create Positions
    const jobRoles = await JobRole.bulkCreate(
      [
        { title: 'SENIOR_DEVELOPER', description: 'Senior Software Developer' },
        { title: 'JUNIOR_DEVELOPER', description: 'Junior Software Developer' },
        { title: 'HR_MANAGER', description: 'HR Manager' },
        { title: 'SALES_MANAGER', description: 'Sales Manager' },
        { title: 'HUMAN_RESOURCES_MANAGER', description: 'Human Resources Manager' },
        { title: 'HR_OPERATIONS', description: 'HR Operations Manager' },
      ],
      { ignoreDuplicates: true },
    );
    logger.info('Positions created');

    // Create Employees
    const employees = await Employee.bulkCreate([
      {
        staffId: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        hireDate: new Date('2023-01-15'),
        departmentName: departments[0].name,
        jobRole: jobRoles[0].title,
        status: 'active',
        dob: new Date('1990-05-15'),
        address: '123 Main St, Cityville',
        nationality: '',
        gender: 'M',
        supervisorId: 1,
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualTransportAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: 'MFB',
        bankCode: '20001',
        accountNumber: '200023123',
        accountName: 'John Doe',
        beneficiaryName: 'Smith Doe',
        beneficiaryRelationship: 'son',
        beneficiaryPhone: '',
        nokName: 'Smith Doe',
        nokRelationship: 'son',
        nokAddress: 'Same as employee',
        nokPhone: '',
        leaveEntitlement: 22,
        nhfApplicable: false,
      },
      {
        staffId: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        hireDate: new Date('2023-03-20'),
        departmentName: departments[0].name,
        jobRole: jobRoles[1].title,
        status: 'active',
        dob: new Date('1992-08-25'),
        address: '456 Elm St, Townsville',
        nationality: '',
        gender: 'M',
        supervisorId: 1,
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualTransportAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: 'MFB',
        bankCode: '20001',
        accountNumber: '200023124',
        accountName: 'Jane Smith',
        beneficiaryName: 'Alice Smith',
        beneficiaryRelationship: 'daughter',
        beneficiaryPhone: '',
        nokName: 'Alice Smith',
        nokRelationship: 'daughter',
        nokAddress: 'Same as employee',
        nokPhone: '',
        leaveEntitlement: 22,
        nhfApplicable: false,
      },
      {
        staffId: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1234567892',
        hireDate: new Date('2022-06-10'),
        departmentName: departments[1].name,
        jobRole: jobRoles[2].title,
        status: 'active',
        dob: new Date('1988-11-12'),
        address: '789 Oak St, Villagetown',
        nationality: '',
        gender: 'M',
        supervisorId: 1,
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualTransportAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: 'MFB',
        bankCode: '20001',
        accountNumber: '200023125',
        accountName: 'Bob Johnson',
        beneficiaryName: 'Charlie Johnson',
        beneficiaryRelationship: 'brother',
        beneficiaryPhone: '',
        nokName: 'Charlie Johnson',
        nokRelationship: 'brother',
        nokAddress: 'Same as employee',
        nokPhone: '',
        leaveEntitlement: 22,
        nhfApplicable: false,
        shouldCreateUser: false,
      },
    ]);
    logger.info('Employees created');

    const empList = employees;

    // Create Leave Requests
    await Leave.bulkCreate(
      [
        {
          employeeId: empList[0].id,
          startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
          type: 'vacation',
          status: 'pending',
          reason: 'Family vacation',
        },
      ],
      { ignoreDuplicates: true },
    );
    logger.info('Leave requests created');

    const batch = await PayrollBatch.create({
      payPeriod: '2025-02',
      status: 'APPROVED',
      batchId: 'PAY-2025',
      totalGross: 2000.4,
      totalNet: 200.4,
      recordCount: 2,
    });

    // Create Payroll Records
    await Payroll.bulkCreate(
      [
        {
          employeeId: empList[0].id,
          batchId: batch.batchId,
          payPeriod: '2026-01',
          basicSalary: 75000,
          grossSalary: 80000,
          housingAllowance: 5000,
          transportAllowance: 3000,
          leaveAllowance: 2000,
          otherAllowance: 1000,
          pensionDeduction: 0,
          nhfDeduction: 0,
          loanDeduction: 0,
          payeDeduction: 3000,
          status: 'processed',
        },
        {
          employeeId: empList[1].id,
          batchId: batch.batchId,
          payPeriod: '2026-01',
          basicSalary: 65000,
          grossSalary: 70000,
          housingAllowance: 4000,
          transportAllowance: 2500,
          leaveAllowance: 1500,
          otherAllowance: 800,
          pensionDeduction: 0,
          nhfDeduction: 0,
          loanDeduction: 0,
          payeDeduction: 2500,
          status: 'processed',
        },
      ],
      { ignoreDuplicates: true },
    );
    logger.info('Payroll records created');

    await User.bulkCreate(
      [
        {
          firstName: 'oluwaseun',
          lastName: 'ABIOLA',
          email: 'o@o.com',
          departmentName: departments[1].name,
          password: '',
          jobRole: 'HR_OPERATIONS',
        },
      ],
      { ignoreDuplicates: true },
    );

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
