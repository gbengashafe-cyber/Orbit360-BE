import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';

export const JOB_POSTING_STATUS = ['draft', 'pending_approval', 'active', 'closed', 'on_hold', 'rejected'] as const;

export class JobPosting extends Model<InferAttributes<JobPosting>, InferCreationAttributes<JobPosting>> {
  declare id: CreationOptional<number>;
  public title!: string;
  public description!: string;
  public department!: string;
  public location!: string;
  public employment_type!: 'full_time' | 'part_time' | 'contract' | 'temporary';
  public salary_range_min!: number;
  public salary_range_max!: number;
  public requirements!: string;
  public posted_date!: Date;
  declare status: CreationOptional<(typeof JOB_POSTING_STATUS)[number]>;
  declare created_by: ForeignKey<User['id']>;
  declare approved_by: CreationOptional<ForeignKey<User['id']>>;
  declare approved_date: CreationOptional<Date>;
  declare closedDate: CreationOptional<Date>;
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
      type: DataTypes.ENUM(...JOB_POSTING_STATUS),
      defaultValue: 'draft',
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: { model: User, key: 'id' },
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      references: { model: User, key: 'id' },
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

JobPosting.belongsTo(User, { foreignKey: 'createdBy', as: 'initiator' });
JobPosting.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
