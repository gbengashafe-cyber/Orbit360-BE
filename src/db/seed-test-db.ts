import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { JobRole } from '../features/job-role/job-role.model';
import { LoanType } from '../features/loans/loan-types/loan-types.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { LeaveBalance } from '../features/leave/leave-balance.model';
import { User } from '../features/users/user.model';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await Company.bulkCreate([{ name: 'MFB' }], { ignoreDuplicates: true });
    const company = await Company.findOne();
    await Company.bulkCreate([{ name: 'ASSET MANAGEMENT' }], { ignoreDuplicates: true });

    if (!company) {
      throw ApiError.badRequest('Missing default company set up');
    }

    await Department.bulkCreate(
      [
        { name: 'Information Technology', description: '', companyId: company?.id },
        { name: 'Operations', description: '', companyId: company?.id },
        { name: 'Internal Control', description: '', companyId: company?.id },
        { name: 'Audit', description: '', companyId: company?.id },
        { name: 'Marketing', description: '', companyId: company?.id },
        { name: 'Security', description: '', companyId: company?.id },
        { name: 'Human Resources', description: '', companyId: company?.id },
        { name: "MD's Office", description: '', companyId: company?.id },
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

    const hrDepartment = await Department.findOne({ where: { name: 'HUMAN RESOURCES' } });
    const operationsDepartment = await Department.findOne({ where: { name: 'OPERATIONS' } });
    const itDepartment = await Department.findOne({ where: { name: 'INFORMATION TECHNOLOGY' } });
    const mdsDepartment = await Department.findOne({ where: { name: "MD's Office" } });

    if (!hrDepartment || !operationsDepartment || !mdsDepartment || !itDepartment) {
      throw ApiError.badRequest('Missing one or more department set up');
    }

    await JobRole.bulkCreate(
      [
        { departmentId: itDepartment.id, title: 'Senior Developer', description: '' },
        { departmentId: itDepartment.id, title: 'Junior Developer', description: '' },
        { departmentId: hrDepartment.id, title: 'HR Operations', description: '' },
        { departmentId: hrDepartment.id, title: 'HR Manager', description: '' },
        { departmentId: operationsDepartment.id, title: 'Operations Officer', description: '' },
        { departmentId: operationsDepartment.id, title: 'Operations Supervisor', description: '' },
        { departmentId: mdsDepartment.id, title: 'Managing Director', description: '' },
      ],
      { ignoreDuplicates: true },
    );

    const mdRole = await JobRole.findOne({ where: { title: 'MANAGING DIRECTOR' } });
    const hrOperationsRole = await JobRole.findOne({ where: { title: 'HR OPERATIONS' } });
    const hrManagerRole = await JobRole.findOne({ where: { title: 'HR MANAGER' } });
    const employeeRole = await JobRole.findOne({ where: { title: 'OPERATIONS OFFICER' } });
    const employeeSupervisorRole = await JobRole.findOne({ where: { title: 'OPERATIONS SUPERVISOR' } });

    console.log(!hrOperationsRole, !hrManagerRole, !employeeRole, !employeeSupervisorRole, !mdRole);
    if (!hrOperationsRole || !hrManagerRole || !employeeRole || !employeeSupervisorRole || !mdRole) {
      throw ApiError.badRequest('Missing one or more job roles set up');
    }

    await JobRolePermissions.truncate();
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
        { permission: 'MANAGE_DOCUMENTS', jobRoleId: hrOperationsRole.id },
        { permission: 'MANAGE_DOCUMENTS', jobRoleId: hrManagerRole.id },
      ],
      { ignoreDuplicates: true },
    );

    // Temporarily use plaintext for debugging
    const hashedPassword = '';

    const employees: any = [
      {
        firstName: 'Test',
        lastName: 'HR',
        email: 'test-hr@gmail.com',
        password: hashedPassword,
        companyId: company.id,
        jobRoleId: hrOperationsRole.id,
        departmentId: hrDepartment.id,
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
        createdBy: 5,
      },
      {
        firstName: 'Test',
        lastName: 'HR Manager',
        email: 'test-hr-manager@gmail.com',
        password: hashedPassword,
        companyId: company.id,
        departmentId: hrDepartment.id,
        jobRoleId: hrManagerRole.id,
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
        createdBy: 5,
      },
      {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test-employee@gmail.com',
        password: hashedPassword,
        companyId: company.id,
        departmentId: operationsDepartment.id,
        jobRoleId: employeeRole.id,
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
        createdBy: 5,
      },
      {
        firstName: 'Test',
        lastName: 'Supervisor',
        email: 'test-supervisor@gmail.com',
        password: hashedPassword,
        companyId: company.id,
        departmentId: operationsDepartment.id,
        jobRoleId: employeeSupervisorRole.id,
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
        createdBy: 5,
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

    // Seed leave balances for employees
    // Clear old leave balances first
    await LeaveBalance.truncate();

    const currentYear = new Date().getFullYear();

    const leaveTypesDef = [
      { type: 'annual', totalDays: 15, usedDays: 0 },
      { type: 'sick', totalDays: 5, usedDays: 0 },
      { type: 'maternity', totalDays: 90, usedDays: 0 },
      { type: 'paternity', totalDays: 5, usedDays: 0 },
      { type: 'compassionate', totalDays: 5, usedDays: 0 },
      { type: 'casual', totalDays: 5, usedDays: 0 },
    ];

    const employees_to_update = [employeeRecord, supervisorEmployee, hrSupervisorEmployee, hrEmployeeRecord];

    for (const emp of employees_to_update) {
      if (emp) {
        const leaveBalances = leaveTypesDef.map(({ type, totalDays, usedDays }) => ({
          employeeId: emp.id,
          leaveType: type,
          totalDays,
          usedDays,
          remainingDays: totalDays - usedDays,
          year: currentYear,
        }));

        await LeaveBalance.bulkCreate(leaveBalances);
      }
    }

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
