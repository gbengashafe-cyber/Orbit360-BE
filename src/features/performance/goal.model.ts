import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface GoalAttributes {
  id?: number;
  employee_id: number;
  title: string;
  description: string;
  target_value?: number;
  current_progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'on_hold';
  start_date: Date;
  end_date: Date;
  assigned_by?: string;
  completion_percentage?: number;
}

export class Goal extends Model<GoalAttributes> implements GoalAttributes {
  public id!: number;
  public employee_id!: number;
  public title!: string;
  public description!: string;
  public target_value!: number;
  public current_progress!: number;
  public status!: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'on_hold';
  public start_date!: Date;
  public end_date!: Date;
  public assigned_by!: string;
  public completion_percentage!: number;
}

Goal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    target_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    current_progress: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'failed', 'on_hold'),
      defaultValue: 'not_started',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assigned_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
    modelName: 'Goal',
    tableName: 'goals',
  },
);
