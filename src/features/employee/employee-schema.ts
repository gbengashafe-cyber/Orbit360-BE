import { DataTypes, Model, ModelAttributes } from 'sequelize';
import { Company } from '../company/company.model';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { Employee } from './employee.model';

export const employeeStatus = ['ACTIVE', 'SUSPENDED', 'EXITED', 'ON_LEAVE', 'PENDING_APPROVAL', 'CANCELLED'] as const;

export const EmployeeFields: ModelAttributes<Model, any> = {
  companyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Company, key: 'id' } },
  jobRoleId: { type: DataTypes.INTEGER, allowNull: false, references: { model: JobRole, key: 'id' } },
  departmentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Department, key: 'id' } },
  staffId: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    set(value: string) {
      this.setDataValue('lastName', value?.toUpperCase());
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isOldEnough(value: string) {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 18) {
          throw new Error('Employee must be at least 18 years old');
        }
      },
    },
  },
  gender: {
    type: DataTypes.ENUM('M', 'F'),
  },
  nationality: { type: DataTypes.STRING(30) },
  address: {
    type: DataTypes.STRING(100),
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      notFuture(value: Date) {
        if (new Date(value) > new Date()) {
          throw new Error('Hire date cannot be in the future');
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM(...employeeStatus),
    defaultValue: 'PENDING_APPROVAL',
    set(value: string) {
      this.setDataValue('status', value.toUpperCase() as (typeof employeeStatus)[number]);
    },
  },
  exitDate: {
    type: DataTypes.DATEONLY,
  },
  supervisorId: {
    type: DataTypes.INTEGER,
    references: { model: Employee, key: 'id' },
    allowNull: true,
  },
  annualBasicSalary: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
  annualHousingAllowance: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0 },
  annualTransportAllowance: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0 },
  annualLeaveAllowance: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0 },
  annualOtherAllowances: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0 },
  bankName: {
    type: DataTypes.STRING(50),
    set(value: string) {
      this.setDataValue('bankName', value.toUpperCase());
    },
  },
  bankCode: {
    type: DataTypes.STRING(30),
  },
  accountNumber: {
    type: DataTypes.STRING(20),
  },
  accountName: {
    type: DataTypes.STRING(100),
    set(value: string) {
      this.setDataValue('accountName', value.toUpperCase());
    },
  },
  beneficiaryName: { type: DataTypes.STRING(100) },
  beneficiaryRelationship: { type: DataTypes.STRING(50) },
  beneficiaryPhone: { type: DataTypes.STRING(50) },
  nokName: { type: DataTypes.STRING(100) },
  nokRelationship: { type: DataTypes.STRING(50) },
  nokPhone: { type: DataTypes.STRING(50) },
  nokAddress: { type: DataTypes.STRING(100) },
  leaveEntitlement: { type: DataTypes.INTEGER() },
  nhfApplicable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  annualRentAmount: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
};

export const EmployeeFieldKeys = Object.keys(EmployeeFields) as Array<keyof typeof EmployeeFields>;
