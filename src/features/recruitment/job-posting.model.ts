import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface JobPostingAttributes {
  id?: number;
  title: string;
  description: string;
  department: string;
  location: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  salary_range_min?: number;
  salary_range_max?: number;
  requirements?: string;
  posted_date: Date;
  status: 'draft' | 'pending_approval' | 'active' | 'closed' | 'on_hold' | 'rejected';
  created_by: string;
  approved_by?: string;
  approved_date?: Date;
  closedDate?: Date;
}

export class JobPosting extends Model<JobPostingAttributes> implements JobPostingAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public department!: string;
  public location!: string;
  public employment_type!: 'full_time' | 'part_time' | 'contract' | 'temporary';
  public salary_range_min!: number;
  public salary_range_max!: number;
  public requirements!: string;
  public posted_date!: Date;
  public status!: 'draft' | 'pending_approval' | 'active' | 'closed' | 'on_hold' | 'rejected';
  public created_by!: string;
  public approved_by!: string;
  public approved_date!: Date;
  public closedDate!: Date;
}

JobPosting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    employment_type: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'temporary'),
      allowNull: false,
      defaultValue: 'full_time',
    },
    salary_range_min: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    salary_range_max: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    posted_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'active', 'closed', 'on_hold', 'rejected'),
      defaultValue: 'draft',
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'JobPosting',
    tableName: 'job_postings',
  },
);
