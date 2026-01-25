import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';

interface JobApplicationAttributes {
  id?: number;
  job_posting_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  resume_url?: string;
  cover_letter?: string;
  applied_date: Date;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  interview_date?: Date;
  interview_notes?: string;
  rating?: number;
}

export class JobApplication extends Model<InferAttributes<JobApplication>, InferCreationAttributes<JobApplication>> {
  declare id: CreationOptional<number>;
  public job_posting_id!: number;
  public applicant_name!: string;
  public applicant_email!: string;
  public applicant_phone!: string;
  public resume_url!: string;
  public cover_letter!: string;
  public applied_date!: Date;
  public status!: 'applied' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  declare interview_date: CreationOptional<Date>;
  declare interview_notes: CreationOptional<string>;
  declare rating: CreationOptional<number>;
  declare applicant_id: CreationOptional<string>;
  declare salary_expectation: CreationOptional<number>;
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
    applicant_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    applicant_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    applicant_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    applicant_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    salary_expectation: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    resume_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    applied_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('applied', 'under_review', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'),
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
  },
  {
    sequelize: db,
    modelName: 'JobApplication',
    tableName: 'job_applications',
  },
);
