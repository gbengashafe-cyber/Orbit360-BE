import { db } from '.';
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

const seedOrganizationalStructure = async () => {
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
      name: 'Famous Holdings',
      departments: [
        {
          name: 'Group - Human Resources',
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
    for (const _sbu of SBUs) {
      const [company] = await Company.findOrCreate({ where: { name: _sbu.name }, defaults: { name: _sbu.name } });

      for (const _department of _sbu.departments) {
        const payload = { name: _department.name, companyId: company.id };
        const [department] = await Department.findOrCreate({ where: payload, defaults: payload });

        for (const _jobRole of _department.jobRoles) {
          const payload = { title: _jobRole, departmentId: department.id };
          await JobRole.findOrCreate({ where: payload, defaults: payload });
        }
      }
    }
  } catch (error) {
    logger.error('Unable to create organization structure');
    logger.error(error);
  }
};

const setupSystemConfiguration = async () => {
  await LoanType.bulkCreate(
    [
      { name: 'Thrift', interestRate: 0, maxTenureMonths: 6 },
      { name: 'Salary Advance', interestRate: 15.3, maxTenureMonths: 1 },
      { name: 'Personal', interestRate: 3, maxTenureMonths: 6 },
    ],
    { ignoreDuplicates: true },
  );

  const roles = {
    md: await JobRole.findOne({ where: { title: 'MD - MFB' } }),
    hrManager: await JobRole.findOne({ where: { title: 'Chief Human Resource Manager' } }),
    hrOperations: await JobRole.findOne({ where: { title: 'Compensation and Benefits Officer' } }),
    employee: await JobRole.findOne({ where: { title: 'Cash/Teller' } }),
    employeeSupervisor: await JobRole.findOne({ where: { title: 'Head - Customer Care' } }),
  };

  if (!roles.hrOperations || !roles.hrManager || !roles.employee || !roles.employeeSupervisor || !roles.md) {
    throw ApiError.badRequest('Missing one or more job roles set up');
  }

  await JobRolePermissions.truncate();
  await JobRolePermissions.bulkCreate(
    [
      // HR Operations permissions
      { permission: 'MANAGE_EMPLOYEES', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_ONBOARDING', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_USERS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_PAYROLLS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_LOANS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_DOCUMENTS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_RECRUITMENT', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_JOB_POSTINGS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_EXITS', jobRoleId: roles.hrOperations.id },
      { permission: 'MANAGE_TRAINING_REQUESTS', jobRoleId: roles.hrOperations.id },
      { permission: 'LIST_LOANS', jobRoleId: roles.hrOperations.id },
      { permission: 'LIST_EMPLOYEES', jobRoleId: roles.hrOperations.id },
      { permission: 'LIST_PAYROLLS', jobRoleId: roles.hrOperations.id },
      { permission: 'LIST_TRAINING_REQUESTS', jobRoleId: roles.hrOperations.id },

      // HR Manager permissions
      { permission: 'APPROVE_LOANS', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_PAYROLLS', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_EMPLOYEES', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_DOCUMENT_DELETION', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_EXITS', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_RECRUITMENT', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_JOB_POSTINGS', jobRoleId: roles.hrManager.id },
      { permission: 'APPROVE_TRAINING_REQUESTS', jobRoleId: roles.hrManager.id },
      { permission: 'LIST_LOANS', jobRoleId: roles.hrManager.id },
      { permission: 'LIST_EMPLOYEES', jobRoleId: roles.hrManager.id },
      { permission: 'LIST_PAYROLLS', jobRoleId: roles.hrManager.id },
      { permission: 'LIST_TRAINING_REQUESTS', jobRoleId: roles.hrManager.id },
      { permission: 'MANAGE_DOCUMENTS', jobRoleId: roles.hrManager.id },
      { permission: 'MANAGE_RECRUITMENT', jobRoleId: roles.hrManager.id },

      // MD permissions
      { permission: 'APPROVE_PAYROLL_OVERRIDE', jobRoleId: roles.md.id },
    ],
    { ignoreDuplicates: true },
  );

  return roles;
};

async function seed() {
  if (env.NODE_ENV === 'production') {
    throw 'Running setup script is not allowed in production environment';
  }

  await seedOrganizationalStructure();

  try {
    const company = await Company.findOne();

    if (!company) {
      throw ApiError.internalServerError(`Unable to initiate employee creation. Company not found`);
    }

    const [hrDepartment, operationsDepartment, itDepartment, mdsDepartment] = await Promise.all([
      Department.findOne({ where: { name: 'Group - Human Resources' } }),
      Department.findOne({ where: { name: 'Operations' } }),
      Department.findOne({ where: { name: 'Information Technology' } }),
      Department.findOne({ where: { name: "MD's Office - MFB" } }),
    ]);

    if (!hrDepartment || !operationsDepartment || !mdsDepartment || !itDepartment) {
      throw ApiError.badRequest('Missing one or more department set up');
    }

    const roles = await setupSystemConfiguration();
    if (!roles.hrOperations || !roles.hrManager || !roles.employee || !roles.employeeSupervisor) {
      throw ApiError.badRequest('Missing one or more job roles set up');
    }

    const employees: any = [
      {
        lastName: 'HR',
        email: 'test-hr@gmail.com',
        companyId: company.id,
        jobRoleId: roles.hrOperations.id,
        departmentId: hrDepartment.id,
        staffId: 'MFB001',
        gender: 'F',
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
      {
        lastName: 'HR Manager',
        email: 'test-hr-manager@gmail.com',
        companyId: company.id,
        departmentId: hrDepartment.id,
        jobRoleId: roles.hrManager.id,
        staffId: 'MFB002',
        gender: 'M',
        nhfApplicable: true,
        annualRentAmount: 2000000,
      },
      {
        lastName: 'Employee',
        email: 'test-employee@gmail.com',
        companyId: company.id,
        departmentId: operationsDepartment.id,
        jobRoleId: roles.employee.id,
        staffId: 'MFB003',
        gender: 'F',
        nhfApplicable: false,
      },
      {
        lastName: 'Supervisor',
        email: 'test-supervisor@gmail.com',
        companyId: company.id,
        departmentId: operationsDepartment.id,
        jobRoleId: roles.employeeSupervisor.id,
        staffId: 'MFB004',
        gender: 'M',
        nhfApplicable: false,
        annualRentAmount: 2000000,
      },
    ];

    try {
      const hashedPassword = await AuthUtil.hashPassword(env.TEST_PASSWORD);

      await db.query('SET FOREIGN_KEY_CHECKS = 0');
      const [adminUser] = await User.findOrCreate({
        where: { email: 'kellyshor1@gmail.com' },
        defaults: {
          ...employees[0],
          role: 'admin',
          firstName: 'Test',
          password: hashedPassword,
          status: 'ACTIVE',
          email: 'kellyshor1@gmail.com',
          lastName: 'Admin',
          createdBy: 0,
        },
      });

      const enrichedEmployees = employees.map((_employee) => ({
        ..._employee,
        firstName: 'Test',
        password: hashedPassword,
        status: 'ACTIVE',
        phone: '08070707',
        nationality: 'Nigerian',
        address: '',
        createdBy: adminUser.id,
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
        leaveEntitlement: 15,
        hireDate: new Date('2018-01-01'),
        dob: new Date('2000-01-01'),
      }));

      await User.bulkCreate(enrichedEmployees, { ignoreDuplicates: true });
      await Employee.bulkCreate(enrichedEmployees, { ignoreDuplicates: true });
    } catch (error) {
      logger.error('Error setting up users and employees');
      throw error;
    } finally {
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    const [employeeRecord, supervisorEmployee, hrSupervisorEmployee, hrEmployeeRecord] = await Promise.all([
      Employee.findOne({ where: { email: 'test-employee@gmail.com' } }),
      Employee.findOne({ where: { email: 'test-supervisor@gmail.com' } }),
      Employee.findOne({ where: { email: 'test-hr-manager@gmail.com' } }),
      Employee.findOne({ where: { email: 'test-hr@gmail.com' } }),
    ]);

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
