import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface LeaveTypeAttributes {
  id?: number;
  name: string;
  description?: string;
  defaultDays: number;
  requiresApproval: boolean;
  isActive: boolean;
}

export class LeaveType extends Model<LeaveTypeAttributes> implements LeaveTypeAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public defaultDays!: number;
  public requiresApproval!: boolean;
  public isActive!: boolean;
}

LeaveType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'LeaveType',
    tableName: 'leave_types',
  },
);
