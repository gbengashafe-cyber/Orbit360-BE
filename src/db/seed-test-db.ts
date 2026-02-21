import bcrypt from 'bcryptjs';
import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { JobRole } from '../features/job-role/job-role.model';
import { LoanType } from '../features/loans/loan-types/loan-types.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { User } from '../features/users/user.model';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

async function seed() {
  try {
    const companies = await Company.findOne();

    await Department.bulkCreate(
      [
        { name: 'Information Technology', description: '', companyId: companies?.id },
        { name: 'Operations', description: '', companyId: companies?.id },
        { name: 'Internal Control', description: '', companyId: companies?.id },
        { name: 'Audit', description: '', companyId: companies?.id },
        { name: 'Marketing', description: '', companyId: companies?.id },
        { name: 'Security', description: '', companyId: companies?.id },
        { name: 'Human Resources', description: '', companyId: companies?.id },
      ],
      { ignoreDuplicates: true },
    );

    await LoanType.bulkCreate(
      [
        { name: 'Thrift', interestRate: 0, maxTenureMonths: 6 },
        { name: 'Salary Advance', interestRate: 15.3, maxTenureMonths: 50 },
        { name: 'Personal', interestRate: 3, maxTenureMonths: 6 },
      ],
      { ignoreDuplicates: true },
    );

    const jobRoles = await JobRole.bulkCreate(
      [
        { title: 'HR Operations', description: '' },
        { title: 'Senior Developer', description: '' },
        { title: 'Junior Developer', description: '' },
        { title: 'Sales Manager', description: '' },
        { title: 'HR Manager', description: '' },
        { title: 'Operations Officer', description: '' },
        { title: 'Operations Supervisor', description: '' },
        { title: 'Managing Director', description: '' },
      ],
      { ignoreDuplicates: true },
    );

    await JobRolePermissions.truncate();

    const mdRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'MANAGING DIRECTOR');
    const hrOperationsRole = await JobRole.findOne({ where: { title: 'HR OPERATIONS' } });
    const hrManagerRole = await JobRole.findOne({ where: { title: 'HR MANAGER' } });
    const employeeRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'OPERATIONS OFFICER');
    const employeeSupervisorRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'OPERATIONS SUPERVISOR');
    const hrDepartment = await Department.findOne({ where: { name: 'HUMAN RESOURCES' } });
    const operationsDepartment = await Department.findOne({ where: { name: 'OPERATIONS' } });

    if (!hrOperationsRole || !hrManagerRole || !employeeRole || !employeeSupervisorRole || !mdRole) {
      throw ApiError.badRequest('Missing one or more job roles set up');
    }

    if (!hrDepartment || !operationsDepartment) {
      throw ApiError.badRequest('Missing one or more department set up');
    }
    await JobRolePermissions.bulkCreate(
      [
        { permission: 'MANAGE_EMPLOYEES', jobRoleId: hrOperationsRole.id },
        { permission: 'MANAGE_ONBOARDING', jobRoleId: hrOperationsRole.id },
        { permission: 'MANAGE_USERS', jobRoleId: hrOperationsRole.id },
        { permission: 'MANAGE_PAYROLLS', jobRoleId: hrOperationsRole.id },
        { permission: 'MANAGE_LOANS', jobRoleId: hrOperationsRole.id },
        { permission: 'LIST_LOANS', jobRoleId: hrOperationsRole.id },
        { permission: 'LIST_LOANS', jobRoleId: hrManagerRole.id },
        { permission: 'LIST_EMPLOYEES', jobRoleId: hrOperationsRole.id },
        { permission: 'LIST_EMPLOYEES', jobRoleId: hrManagerRole.id },
        { permission: 'APPROVE_LOANS', jobRoleId: hrManagerRole.id },
        { permission: 'APPROVE_PAYROLLS', jobRoleId: hrManagerRole.id },
        { permission: 'APPROVE_EMPLOYEES', jobRoleId: hrManagerRole.id },
        { permission: 'LIST_PAYROLLS', jobRoleId: hrManagerRole.id },
        { permission: 'LIST_PAYROLLS', jobRoleId: hrOperationsRole.id },
        { permission: 'APPROVE_PAYROLL_OVERRIDE', jobRoleId: mdRole.id },
      ],
      { ignoreDuplicates: true },
    );

    // Temporarily use plaintext for debugging
    const hashedPassword = 'password';

    const employees: any = [
      {
        firstName: 'Test',
        lastName: 'HR',
        email: 'test-hr@gmail.com',
        password: hashedPassword,
        jobRole: hrOperationsRole.title,
        departmentName: hrDepartment.name,
        status: 'ACTIVE',
        staffId: 'MFB001',
        phone: '08070707',
        dob: new Date('2000-01-01'),
        gender: 'F',
        nationality: 'Nigerian',
        address: '',
        hireDate: new Date('2018-01-01'),
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualTransportAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryPhone: '',
        nokName: '',
        nokRelationship: '',
        nokPhone: '',
        nokAddress: '',
        leaveEntitlement: 20,
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
      {
        firstName: 'Test',
        lastName: 'HR Manager',
        email: 'test-hr-manager@gmail.com',
        password: hashedPassword,
        jobRole: hrManagerRole.title,
        departmentName: hrDepartment.name,
        status: 'ACTIVE',
        staffId: 'MFB002',
        phone: '08070707',
        dob: new Date('2000-01-01'),
        gender: 'M',
        nationality: 'Nigerian',
        address: '',
        hireDate: new Date('2018-01-01'),
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualTransportAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryPhone: '',
        nokName: '',
        nokRelationship: '',
        nokPhone: '',
        nokAddress: '',
        leaveEntitlement: 20,
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
      {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test-employee@gmail.com',
        password: hashedPassword,
        jobRole: employeeRole.title,
        departmentName: operationsDepartment.name,
        status: 'ACTIVE',
        staffId: 'MFB003',
        phone: '08070707',
        dob: new Date('2000-01-01'),
        gender: 'F',
        nationality: 'Nigerian',
        address: '',
        hireDate: new Date('2018-01-01'),
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualTransportAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryPhone: '',
        nokName: '',
        nokRelationship: '',
        nokPhone: '',
        nokAddress: '',
        leaveEntitlement: 20,
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
      {
        firstName: 'Test',
        lastName: 'Supervisor',
        email: 'test-supervisor@gmail.com',
        password: hashedPassword,
        jobRole: employeeSupervisorRole.title,
        departmentName: operationsDepartment.name,
        status: 'ACTIVE',
        staffId: 'MFB004',
        phone: '08070707',
        dob: new Date('2000-01-01'),
        gender: 'M',
        nationality: 'Nigerian',
        address: '',
        hireDate: new Date('2018-01-01'),
        annualBasicSalary: 200000,
        annualHousingAllowance: 200000,
        annualTransportAllowance: 200000,
        annualLeaveAllowance: 200000,
        annualOtherAllowances: 200000,
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        beneficiaryName: '',
        beneficiaryRelationship: '',
        beneficiaryPhone: '',
        nokName: '',
        nokRelationship: '',
        nokPhone: '',
        nokAddress: '',
        leaveEntitlement: 20,
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
    ];

    await User.bulkCreate(employees, { ignoreDuplicates: true });
    await Employee.bulkCreate(employees, { ignoreDuplicates: true });
    await User.create(
      { ...employees[0], role: 'admin', email: 'test-admin@gmail.com', lastName: 'Admin' },
      { ignoreDuplicates: true },
    );

    const employeeRecord = await Employee.findOne({ where: { email: 'test-employee@gmail.com' } });
    const supervisorEmployee = await Employee.findOne({ where: { email: 'test-supervisor@gmail.com' } });
    const hrSupervisorEmployee = await Employee.findOne({ where: { email: 'test-hr-manager@gmail.com' } });
    const hrEmployeeRecord = await Employee.findOne({ where: { email: 'test-hr@gmail.com' } });

    await employeeRecord?.update({ supervisorId: supervisorEmployee?.id });
    await hrEmployeeRecord?.update({ supervisorId: hrSupervisorEmployee?.id });

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
