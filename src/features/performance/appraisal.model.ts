import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface AppraisalCycleAttributes {
  id?: number;
  cycle_name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  review_deadline: Date;
  status: 'planning' | 'active' | 'review' | 'completed' | 'closed';
  created_by: string;
  department?: string;
}

export interface AppraisalAttributes {
  id?: number;
  appraisal_cycle_id: number;
  employee_id: number;
  manager_id: number;
  overall_rating?: number;
  performance_summary?: string;
  strengths?: string;
  areas_for_improvement?: string;
  goals_achievement?: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'reviewed';
  submitted_date?: Date;
  reviewed_date?: Date;
}

export class AppraisalCycle extends Model<AppraisalCycleAttributes> implements AppraisalCycleAttributes {
  public id!: number;
  public cycle_name!: string;
  public description!: string;
  public start_date!: Date;
  public end_date!: Date;
  public review_deadline!: Date;
  public status!: 'planning' | 'active' | 'review' | 'completed' | 'closed';
  public created_by!: string;
  public department!: string;
}

export class Appraisal extends Model<AppraisalAttributes> implements AppraisalAttributes {
  public id!: number;
  public appraisal_cycle_id!: number;
  public employee_id!: number;
  public manager_id!: number;
  public overall_rating!: number;
  public performance_summary!: string;
  public strengths!: string;
  public areas_for_improvement!: string;
  public goals_achievement!: number;
  public status!: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'reviewed';
  public submitted_date!: Date;
  public reviewed_date!: Date;
}

AppraisalCycle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cycle_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    review_deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'review', 'completed', 'closed'),
      defaultValue: 'planning',
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'AppraisalCycle',
    tableName: 'appraisal_cycles',
  }
);

Appraisal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appraisal_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    overall_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    performance_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    strengths: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    areas_for_improvement: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goals_achievement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'submitted', 'completed', 'reviewed'),
      defaultValue: 'pending',
    },
    submitted_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Appraisal',
    tableName: 'appraisals',
  }
);
