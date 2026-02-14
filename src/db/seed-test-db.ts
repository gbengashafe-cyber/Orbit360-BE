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

    const departments = await Department.bulkCreate(
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
      ],
      { ignoreDuplicates: true },
    );

    const hrOperationsRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'HR OPERATIONS');
    const hrManagerRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'HR MANAGER');
    const employeeRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'OPERATIONS OFFICER');
    const employeeSupervisorRole = jobRoles.find((_jobRole) => _jobRole.title.toUpperCase() == 'OPERATIONS SUPERVISOR');
    const hrDepartment = departments.find((_department) => _department.name.toUpperCase() == 'HUMAN RESOURCES');
    const operationsDepartment = departments.find((_department) => _department.name.toUpperCase() == 'OPERATIONS');

    if (!hrOperationsRole || !hrManagerRole || !employeeRole || !employeeSupervisorRole) {
      throw ApiError.badRequest('Missing one or more job roles set up');
    }

    if (!hrDepartment || !operationsDepartment) {
      throw ApiError.badRequest('Missing one or more department set up');
    }

    const employees: any = [
      {
        firstName: 'Test',
        lastName: 'HR',
        email: 'test-hr@gmail.com',
        password: '',
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
        password: '',
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
        password: '',
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
        password: '',
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
    const employeeRecords = await Employee.bulkCreate(employees, { ignoreDuplicates: true });

    const employeeRecord = employeeRecords.find((_employee) => _employee.email === 'test-employee@gmail.com');
    const supervisorUser = employeeRecords.find((_employee) => _employee.email === 'test-supervisor@gmail.com');

    await employeeRecord?.update({ supervisorId: supervisorUser?.id });

    await JobRolePermissions.truncate();

    await JobRolePermissions.bulkCreate(
      [
        { permission: 'MANAGE_EMPLOYEES', jobRole: 'HR Operations' },
        { permission: 'MANAGE_ONBOARDING', jobRole: 'HR Operations' },
        { permission: 'MANAGE_USERS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_PAYROLLS', jobRole: 'HR Operations' },
        { permission: 'MANAGE_LOANS', jobRole: 'HR Operations' },
        { permission: 'LIST_LOANS', jobRole: 'HR Operations' },
        { permission: 'LIST_LOANS', jobRole: 'HR Manager' },
        { permission: 'LIST_EMPLOYEES', jobRole: 'HR Operations' },
        { permission: 'LIST_EMPLOYEES', jobRole: 'HR Manager' },
        { permission: 'APPROVE_LOANS', jobRole: 'HR Manager' },
        { permission: 'APPROVE_PAYROLLS', jobRole: 'HR Manager' },
        { permission: 'APPROVE_EMPLOYEES', jobRole: 'HR Manager' },
        { permission: 'LIST_PAYROLLS', jobRole: 'HR Manager' },
        { permission: 'LIST_PAYROLLS', jobRole: 'HR Operations' },
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
