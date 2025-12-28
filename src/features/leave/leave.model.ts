import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface LeaveAttributes {
  id?: number;
  employeeId: number;
  startDate: Date;
  endDate: Date;
  type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export class Leave extends Model<LeaveAttributes> implements LeaveAttributes {
  public id!: number;
  public employeeId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public type!: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity';
  public status!: 'pending' | 'approved' | 'rejected';
  public reason!: string;
}

Leave.init(
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Leave',
    tableName: 'leaves',
  },
);

Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
