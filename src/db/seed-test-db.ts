import { env } from '../config/env';
import { AuthUtil } from '../features/authentication/auth.utils';
import { Company } from '../features/company/company.model';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { JobRole } from '../features/job-role/job-role.model';
import { LeaveBalance } from '../features/leave/leave-balance.model';
import { LoanType } from '../features/loans/loan-types/loan-types.model';
import { JobRolePermissions } from '../features/permissions/permission.model';
import { User } from '../features/users/user.model';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

type SBU = { name: string; departments: { name: string; jobRoles: string[] }[] };

async function seed() {
  const SBUs: SBU[] = [
    {
      name: 'MFB',
      departments: [
        { name: "MD's Office - MFB", jobRoles: ['MD - MFB'] },
        { name: 'Operations', jobRoles: ['Core Banking Operations', 'Cash/Teller', 'Head - Customer Care', 'CCO'] },
        {
          name: 'Finance',
          jobRoles: ['Treasury and Cash Management', 'Management Accounting', 'Financial Accounting', 'Fincon/Budgeting'],
        },
        {
          name: 'Sales',
          jobRoles: [
            'Head - Thrift and Credit',
            'Thrift',
            'MSME Lending',
            'Other Risk Assets',
            'Head - Deposit Mobilization and Credit',
            'Deposit Mobilization',
            'SME Lending',
            'Private Sector Lending',
          ],
        },
        { name: 'Legal', jobRoles: ['Legal Officer'] },
        { name: 'HR and Admin', jobRoles: ['HR/Admin', 'Admin Assistance', 'Office Assistance 1', 'Office Assistance 2'] },
        { name: 'Risk and Compliance', jobRoles: ['Credit Control', 'Branch/Field Underwriting', 'Recovery', 'Remedial Assets'] },
        { name: 'Internal Control', jobRoles: ['Head - Internal Control'] },
      ],
    },
    {
      name: 'Capital',
      departments: [
        { name: "MD's office - Capital", jobRoles: ['MD - Capital'] },
        { name: 'Legal', jobRoles: ['Legal Officer'] },
        { name: 'Audit and Compliance', jobRoles: ['Chief Compliance Officer'] },
        {
          name: 'Finance',
          jobRoles: ['Chief Financial Officer', 'Treasury and Funding Manager', 'Financial Controller', 'Fund Accountant'],
        },
        {
          name: 'Operations',
          jobRoles: [
            'Chief Operations Officer',
            'Technology and Systems Lead',
            'IT and System Support',
            'CRM and Data Analytics Manager',
            'Cybersecurity and Infra Manager',
            'Fund Operations Manager',
            'Performance and Data Analytics',
            'Risk Manager',
            'Operations Support Assistance/Clerk',
            'Portfolio Operations Manager',
            'HR and Admin Support Manager',
          ],
        },
        {
          name: 'Marketing',
          jobRoles: [
            'Chief Marketing Officer',
            'institutional Sales Manager',
            'Business Development Manager',
            'Digital and Retail Distribution',
            'Specialist Media Manager',
          ],
        },
        {
          name: 'Information Technology',
          jobRoles: [
            'Chief Information Officer',
            'Portfolio Manager - Fixed Income and Alternatives',
            'Portfolio Manager - Equity',
            'Quantitative/Risk Analyst',
            'Investment Analyst',
            'Compliance Liaison - Investment',
            'Research and Strategy Manager',
          ],
        },
      ],
    },
    {
      name: 'Human Resources',
      departments: [
        {
          name: 'Human Resources',
          jobRoles: [
            'Chief Human Resource Manager',
            'Talent Acquisition and Workforce Planning Officer',
            'HR Information Systems Officer',
            'Learning and Development Officer',
            'Employee Matters Officer',
            'Compensation and Benefits Officer',
            'Performance Management Officer',
            'Group Admin Manager',
            'Corporate Governance and Policies Officer',
            'HRBP - MFB',
            'HRBP - Capital',
            'HRBP - Real Business',
            'HRBP - Microsystem (Technology)',
            'Admin Officer - MFB',
            'Admin Officer - Real Business',
            'Admin Officer - Technology',
            'Admin Officer - Capital',
          ],
        },
      ],
    },
  ];

  try {
    SBUs.forEach(async (_sbu) => {
      await Company.create({ name: _sbu.name }, { ignoreDuplicates: true });
      const company = await Company.findOne({ where: { name: _sbu.name } });

      if (!company) {
        throw ApiError.internalServerError(`Unable to create SBU: ${_sbu.name}`);
      }

      _sbu.departments.forEach(async (_department) => {
        await Department.create({ name: _department.name, companyId: company.id }, { ignoreDuplicates: true });

        const department = await Department.findOne({ where: { name: _department.name } });

        if (!department) {
          throw ApiError.internalServerError(`Unable to create department: ${_department.name}`);
        }

        _department.jobRoles.forEach(async (_jobRole) => {
          await JobRole.create({ title: _jobRole, departmentId: department.id }, { ignoreDuplicates: true });

          const jobRole = await JobRole.findOne({ where: { title: _jobRole } });

          if (!jobRole) {
            throw ApiError.internalServerError(`Unable to create jobRole: ${_department.name} in ${_department.name} department`);
          }
        });
      });
    });

    const company = await Company.findOne();

    if (!company) {
      throw ApiError.internalServerError(`Unable to initiate employee creation. Company not found`);
    }

    await LoanType.bulkCreate(
      [
        { name: 'Thrift', interestRate: 0, maxTenureMonths: 6 },
        { name: 'Salary Advance', interestRate: 15.3, maxTenureMonths: 1 },
        { name: 'Personal', interestRate: 3, maxTenureMonths: 6 },
      ],
      { ignoreDuplicates: true },
    );

    const hrDepartment = await Department.findOne({ where: { name: 'Human Resources' } });
    const operationsDepartment = await Department.findOne({ where: { name: 'Operations' } });
    const itDepartment = await Department.findOne({ where: { name: 'Information Technology' } });
    const mdsDepartment = await Department.findOne({ where: { name: "MD's Office - MFB" } });

    if (!hrDepartment || !operationsDepartment || !mdsDepartment || !itDepartment) {
      throw ApiError.badRequest('Missing one or more department set up');
    }

    const mdRole = await JobRole.findOne({ where: { title: 'MD - MFB' } });
    const hrManagerRole = await JobRole.findOne({ where: { title: 'Chief Human Resource Manager' } });
    const hrOperationsRole = await JobRole.findOne({ where: { title: 'Compensation and Benefits Officer' } });
    const employeeRole = await JobRole.findOne({ where: { title: 'Cash/Teller' } });
    const employeeSupervisorRole = await JobRole.findOne({ where: { title: 'Head - Customer Care' } });

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

    let hashedPassword = '';
    if (env.NODE_ENV !== 'production' && env.TEST_PASSWORD) {
      hashedPassword = await AuthUtil.hashPassword(env.TEST_PASSWORD);
    }

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
