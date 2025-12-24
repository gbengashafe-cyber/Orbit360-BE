import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from './employee.model';

export class EmployeeCompensation extends Model<
  InferAttributes<EmployeeCompensation>,
  InferCreationAttributes<EmployeeCompensation>
> {
  declare id: CreationOptional<number>;
  declare employeeId: ForeignKey<Employee['employeeId']>;
  declare bankName: string;
  declare bankCode: string;
  declare bankAccount: string;
  declare accountName: string;
  declare nhfApplicable: boolean;
  declare annualBasicSalary: number;
  declare annualHousingAllowance: number;
  declare annualTransportAllowance: number;
  declare annualLeaveAllowance: number;
  declare otherAllowance: number;
  declare beneficiaryName: string;
  declare beneficiaryRelationship: string;
  declare beneficiaryPhone: string;
  declare nokName: string;
  declare nokRelationship: string;
  declare nokPhone: string;
  declare nokAddress: string;
  declare leaveEntitlement: number;
}

EmployeeCompensation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    bankAccount: {
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
    nhfApplicable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    annualBasicSalary: { type: DataTypes.DECIMAL(2), allowNull: false },
    annualHousingAllowance: { type: DataTypes.DECIMAL(2), allowNull: false },
    annualTransportAllowance: { type: DataTypes.DECIMAL(2), allowNull: false },
    annualLeaveAllowance: { type: DataTypes.DECIMAL(2), allowNull: false },
    otherAllowance: { type: DataTypes.DECIMAL(2), allowNull: false },
    beneficiaryName: { type: DataTypes.STRING(100) },
    beneficiaryRelationship: { type: DataTypes.STRING(50) },
    beneficiaryPhone: { type: DataTypes.STRING(50) },
    nokName: { type: DataTypes.STRING(100) },
    nokRelationship: { type: DataTypes.STRING(50) },
    nokPhone: { type: DataTypes.STRING(50) },
    nokAddress: { type: DataTypes.STRING(100) },
    leaveEntitlement: { type: DataTypes.INTEGER() },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'employee_compensation',
  },
);
