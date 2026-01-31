import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { Employee, employeeStatus } from './employee.model';

export class EmployeesTemp extends Model<InferAttributes<EmployeesTemp>, InferCreationAttributes<EmployeesTemp>> {
  declare id: CreationOptional<number>;

  // Mirror all Employee fields for staging
  declare employeeId: string | null;
  declare firstName: string | null;
  declare lastName: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare dob: Date | null;
  declare gender: 'M' | 'F' | null;
  declare nationality: string | null;
  declare address: string | null;
  declare hireDate: Date | null;
  declare departmentName: string | null;
  declare jobRole: string | null;
  declare status: (typeof employeeStatus)[number] | null;
  declare terminationDate: Date | null;
  declare supervisorId: string | null;
  declare annualBasicSalary: number | null;
  declare annualHousingAllowance: number | null;
  declare annualTransportAllowance: number | null;
  declare annualLeaveAllowance: number | null;
  declare annualOtherAllowances: number | null;
  declare bankName: string | null;
  declare bankCode: string | null;
  declare accountNumber: string | null;
  declare accountName: string | null;
  declare beneficiaryName: string | null;
  declare beneficiaryRelationship: string | null;
  declare beneficiaryPhone: string | null;
  declare nokName: string | null;
  declare nokRelationship: string | null;
  declare nokPhone: string | null;
  declare nokAddress: string | null;
  declare leaveEntitlement: number | null;
  declare nhfApplicable: boolean | null;

  // Workflow metadata
  declare changeType: 'create' | 'update' | 'delete';
  declare approvalStatus: 'pending' | 'approved' | 'rejected';
  declare requestedById: ForeignKey<User['id']>;
  declare requestedAt: Date;
  declare reviewedById: ForeignKey<User['id']> | null;
  declare reviewedAt: Date | null;
  declare rejectionReason: string | null;
  declare comments: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date>;
}

EmployeesTemp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: { type: DataTypes.STRING(10), allowNull: true },
    firstName: { type: DataTypes.STRING(50), allowNull: true },
    lastName: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM('M', 'F'), allowNull: true },
    nationality: { type: DataTypes.STRING(30), allowNull: true },
    address: { type: DataTypes.STRING(100), allowNull: true },
    hireDate: { type: DataTypes.DATE, allowNull: true },
    departmentName: { type: DataTypes.STRING, allowNull: true },
    jobRole: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.ENUM, values: employeeStatus, allowNull: true },
    terminationDate: { type: DataTypes.DATE, allowNull: true },
    supervisorId: { type: DataTypes.STRING(10), allowNull: true },
    annualBasicSalary: { type: DataTypes.DECIMAL(17, 2), allowNull: true },
    annualHousingAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: true },
    annualTransportAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: true },
    annualLeaveAllowance: { type: DataTypes.DECIMAL(17, 2), allowNull: true },
    annualOtherAllowances: { type: DataTypes.DECIMAL(17, 2), allowNull: true },
    bankName: { type: DataTypes.STRING(50), allowNull: true },
    bankCode: { type: DataTypes.STRING(30), allowNull: true },
    accountNumber: { type: DataTypes.STRING(20), allowNull: true },
    accountName: { type: DataTypes.STRING(100), allowNull: true },
    beneficiaryName: { type: DataTypes.STRING(100), allowNull: true },
    beneficiaryRelationship: { type: DataTypes.STRING(50), allowNull: true },
    beneficiaryPhone: { type: DataTypes.STRING(50), allowNull: true },
    nokName: { type: DataTypes.STRING(100), allowNull: true },
    nokRelationship: { type: DataTypes.STRING(50), allowNull: true },
    nokPhone: { type: DataTypes.STRING(50), allowNull: true },
    nokAddress: { type: DataTypes.STRING(100), allowNull: true },
    leaveEntitlement: { type: DataTypes.INTEGER, allowNull: true },
    nhfApplicable: { type: DataTypes.BOOLEAN, allowNull: true },

    changeType: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    requestedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    reviewedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    tableName: 'employees_temp',
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
);

EmployeesTemp.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
EmployeesTemp.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewedBy' });
EmployeesTemp.belongsTo(Employee, {
  foreignKey: 'employeeId',
  targetKey: 'employeeId',
  as: 'employee',
});
