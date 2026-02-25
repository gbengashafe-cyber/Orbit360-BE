import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributes,
} from 'sequelize';
import { db } from '../../db';
import { Company } from '../company/company.model';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { User } from '../users/user.model';
import { EmployeeFields, employeeStatus } from './employee-schema';

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
  declare companyId: number;
  declare departmentId: ForeignKey<Department['id']>;
  declare jobRoleId: ForeignKey<JobRole['id']>;
  declare hireDate: Date;
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
  declare annualRentAmount: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare createdBy: ForeignKey<User['id']>;
  declare approvedBy: ForeignKey<User['id']>;
  declare shouldCreateUser: CreationOptional<boolean>;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ...EmployeeFields,
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    createdBy: {
      type: DataTypes.INTEGER,
      references: { model: User, key: 'id' },
      allowNull: false,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      references: { model: User, key: 'id' },
      allowNull: true,
    },
    shouldCreateUser: { type: DataTypes.BOOLEAN, defaultValue: false },
  } as unknown as ModelAttributes<Employee, InferAttributes<Employee>>,
  {
    sequelize: db,
    tableName: 'employees',
    modelName: 'employee',
    timestamps: true,
    indexes: [
      { fields: ['staff_id'], unique: true },
      { fields: ['email'], unique: true },
      { fields: ['first_name'] },
      { fields: ['last_name'] },
      { fields: ['status'] },
      { fields: ['department_id'] },
      { fields: ['job_role_id'] },
      { fields: ['company_id'] },
      { fields: ['supervisor_id'] },
      { fields: ['hire_date'] },
    ],
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
  foreignKey: { name: 'departmentId', allowNull: false },
  as: 'department',
});
Department.hasMany(Employee, {
  foreignKey: { name: 'departmentId', allowNull: false },
  as: 'employees',
});

Employee.belongsTo(JobRole, { foreignKey: { name: 'jobRoleId', allowNull: false }, as: 'jobRole' });
JobRole.hasMany(Employee, { foreignKey: { name: 'jobRoleId', allowNull: false } });

Employee.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false } });
Company.hasMany(Employee, { foreignKey: { name: 'companyId', allowNull: false }, as: 'companyEmployees' });

Employee.belongsTo(User, {
  foreignKey: 'email',
  targetKey: 'email',
  as: 'userAccount',
});

User.hasOne(Employee, {
  foreignKey: 'email',
  sourceKey: 'email',
  as: 'employeeProfile',
});
