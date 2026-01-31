import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { User } from '../users/user.model';

export const employeeStatus = ['active', 'suspended', 'terminated', 'on_leave'];

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  // Personal Information
  declare staffId: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare dob: Date;
  declare gender: 'M' | 'F';
  declare nationality: string;
  declare address: string;
  // Employment details
  declare hireDate: Date;
  declare departmentName: ForeignKey<Department['name']>;
  declare jobRole: ForeignKey<JobRole['title']>;
  declare status: (typeof employeeStatus)[number];
  declare terminationDate: CreationOptional<Date>;
  // Reporting Line
  declare supervisorId: CreationOptional<ForeignKey<Employee['id']>>;
  // Compensation and benefit
  declare annualBasicSalary: number;
  declare annualHousingAllowance: number;
  declare annualTransportAllowance: number;
  declare annualLeaveAllowance: number;
  declare annualOtherAllowances: number;
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
  declare createdAt: CreationOptional<Date>;
  declare createdBy: ForeignKey<User['id']>;
  declare approvedBy: ForeignKey<User['id']>;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    staffId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: 'staffId',
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
      type: DataTypes.DATE,
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
      type: DataTypes.ENUM,
      values: employeeStatus,
      defaultValue: 'active',
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      references: { model: Employee, key: 'id' },
      allowNull: true,
    },
    annualBasicSalary: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
    annualHousingAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
    annualTransportAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
    annualLeaveAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
    annualOtherAllowances: { type: DataTypes.DECIMAL(17, 2), allowNull: false },
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
    createdAt: { type: DataTypes.DATE },
  },
  {
    sequelize: db,
    tableName: 'employees',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['status'] }, { fields: ['department_name'] }, { fields: ['supervisor_id'] }, { fields: ['hire_date'] }],
  },
);

Employee.belongsTo(Employee, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
});

Employee.hasMany(Employee, {
  foreignKey: 'supervisorId',
  as: 'subordinates',
});

Employee.belongsTo(Department, {
  foreignKey: { name: 'departmentName', allowNull: false },
  targetKey: 'name',
});
Department.hasMany(Employee, {
  foreignKey: { name: 'departmentName', allowNull: false },
  sourceKey: 'name',
  as: 'employees',
});

Employee.belongsTo(JobRole, { foreignKey: { name: 'jobRole', allowNull: false }, targetKey: 'title' });
JobRole.hasMany(Employee, { foreignKey: { name: 'jobRole', allowNull: false }, sourceKey: 'title' });
