import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export const payrollStatus = ['generated', 'processed', 'paid', 'failed', 'cancelled'] as const;

export class Payroll extends Model<InferAttributes<Payroll>, InferCreationAttributes<Payroll>> {
  declare id: CreationOptional<number>;
  declare employeeId: ForeignKey<Employee['employeeId']>;
  declare payPeriod: string;
  public basicSalary: number;
  declare grossSalary: number;
  public housingAllowance: number;
  public transportAllowance: number;
  public leaveAllowance: number;
  public otherAllowance: number;
  public pensionDeduction: number;
  public nhfDeduction: number;
  public loanDeduction: number;
  public payeDeduction: number;
  declare status: CreationOptional<(typeof payrollStatus)[number]>;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payPeriod: { type: DataTypes.STRING(7), allowNull: false, unique: 'employee_payPeriod' },
    employeeId: {
      type: DataTypes.STRING(10),
      references: { model: Employee, key: 'employee_id' },
      allowNull: false,
      unique: 'employee_payPeriod',
    },

    grossSalary: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: false,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    housingAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    transportAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    leaveAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    otherAllowance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pensionDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    nhfDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    loanDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payeDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM,
      values: payrollStatus,
      defaultValue: 'generated',
    },
  },
  {
    sequelize: db,
    tableName: 'payrolls',
  },
);

Payroll.belongsTo(Employee, { foreignKey: 'employeeId', targetKey: 'employeeId', as: 'employee' });
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
