import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface LeaveBalanceAttributes {
  id?: number;
  employeeId: number;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

export class LeaveBalance extends Model<LeaveBalanceAttributes> implements LeaveBalanceAttributes {
  public id!: number;
  public employeeId!: number;
  public leaveType!: string;
  public totalDays!: number;
  public usedDays!: number;
  public remainingDays!: number;
  public year!: number;
}

LeaveBalance.init(
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
    leaveType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    usedDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    remainingDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'LeaveBalance',
    tableName: 'leave_balances',
    indexes: [{ unique: true, fields: ['employeeId', 'leaveType', 'year'] }],
  },
);

LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });
