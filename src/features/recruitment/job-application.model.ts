import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Applicant } from './applicant.model';

export const JOB_APPLICATION_STATUS = [
  'applied',
  'under_review',
  'interview_scheduled',
  'interviewed',
  'offered',
  'hired',
  'rejected',
] as const;

export class JobApplication extends Model<InferAttributes<JobApplication>, InferCreationAttributes<JobApplication>> {
  public id!: number;
  public job_posting_id!: number;
  public applicant_id!: number;
  public applied_date!: Date;
  declare status: CreationOptional<(typeof JOB_APPLICATION_STATUS)[number]>;
  public interview_date!: Date;
  public interview_notes!: string;
  public rating!: number;
  public applicant_name!: string;
  public applicant_email!: string;
  public applicant_phone!: string;
  public resume_url!: string;
  public cover_letter!: string;
  public salary_expectation!: number;
}

JobApplication.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    job_posting_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    applicant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    applied_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(...JOB_APPLICATION_STATUS),
      defaultValue: 'applied',
    },
    interview_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    interview_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 },
    },
    // Denormalized fields for backward compatibility
    applicant_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    applicant_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    applicant_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    resume_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    salary_expectation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'JobApplication',
    tableName: 'job_applications',
  },
);

JobApplication.belongsTo(Applicant, {
  foreignKey: 'applicant_id',
  as: 'applicant',
});
