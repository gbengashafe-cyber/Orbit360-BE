import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';

export const employeeStatus = ['active', 'suspended', 'terminated', 'on_leave'];

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  // Personal Information
  declare employeeId: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  declare dob: Date;
  declare gender: 'M' | 'F';
  declare nationality: string;
  declare address: string;
  // Employment details
  public hireDate!: Date;
  declare departmentName: ForeignKey<Department['name']>;
  declare jobRole: ForeignKey<JobRole['title']>;
  declare status: (typeof employeeStatus)[number];
  declare terminationDate: CreationOptional<Date>;
  // Reporting Line
  declare supervisorId: ForeignKey<Employee['employeeId']>;
  // Compensation and benefit
  declare annualBasicSalary: number;
  declare annualHousingAllowance: number;
  declare annualTransportAllowance: number;
  declare annualLeaveAllowance: number;
  declare otherAllowance: number;
  // Bank Information
  declare bankName: string;
  declare bankCode: string;
  declare accountNumber: string;
  declare accountName: string;
  // Emergency Contact and NOK
  declare beneficiaryName: string;
  declare beneficiaryRelationship: string;
  declare beneficiaryPhone: string;
  declare nokName: string;
  declare nokRelationship: string;
  declare nokPhone: string;
  declare nokAddress: string;
  // Leave Entitlement
  declare leaveEntitlement: number;
  // Others
  declare nhfApplicable: boolean;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: 'employeeId',
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
      unique: 'email',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F'),
    },
    nationality: { type: DataTypes.STRING(30) },
    address: {
      type: DataTypes.STRING(100),
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: employeeStatus,
      defaultValue: 'active',
    },
    terminationDate: {
      type: DataTypes.DATE,
    },
    supervisorId: { type: DataTypes.STRING(10), references: { model: Employee, key: 'employee_id' }, allowNull: true },
    annualBasicSalary: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    annualHousingAllowance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    annualTransportAllowance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    annualLeaveAllowance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    otherAllowance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    bankName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      set(value: string) {
        this.setDataValue('bankName', value.toUpperCase());
      },
    },
    bankCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    accountName: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
  },
  {
    sequelize: db,
    tableName: 'employees',
    underscored: true,
  },
);

Employee.belongsTo(Department, {
  foreignKey: { name: 'departmentName', allowNull: false },
  targetKey: 'name',
});
Department.hasMany(Employee, {
  foreignKey: { name: 'departmentName', allowNull: false },
  sourceKey: 'name',
});

Employee.belongsTo(JobRole, { foreignKey: { name: 'jobRole', allowNull: false }, targetKey: 'title' });
JobRole.hasMany(Employee, { foreignKey: { name: 'jobRole', allowNull: false }, sourceKey: 'title' });
