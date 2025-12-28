import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface PayrollAttributes {
  id?: number;
  employeeId: number;
  month: number;
  year: number;
  baseSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
}

export class Payroll extends Model<PayrollAttributes> implements PayrollAttributes {
  public id!: number;
  public employeeId!: number;
  public month!: number;
  public year!: number;
  public baseSalary!: number;
  public allowances!: number;
  public deductions!: number;
  public netSalary!: number;
  public status!: 'pending' | 'processed' | 'paid';
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    baseSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    allowances: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    netSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'paid'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize: db,
    modelName: 'Payroll',
    tableName: 'payrolls',
  },
);

Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
