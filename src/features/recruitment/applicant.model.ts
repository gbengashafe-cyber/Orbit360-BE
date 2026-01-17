import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface ApplicantAttributes {
  id?: number;
  name: string;
  email: string;
  phone: string;
  resume_url?: string;
  cover_letter?: string;
  salary_expectation?: number;
  source?: string; // e.g., 'linkedin', 'indeed', 'referral', 'direct', 'manual'
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Applicant extends Model<ApplicantAttributes> implements ApplicantAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public resume_url!: string;
  public cover_letter!: string;
  public salary_expectation!: number;
  public source!: string;
  public notes!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Applicant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
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
    salary_expectation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('linkedin', 'indeed', 'referral', 'direct', 'manual'),
      allowNull: true,
      defaultValue: 'manual',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Applicant',
    tableName: 'applicants',
  },
);

// Set up associations after model definition
export function setupApplicantAssociations() {
  const JobApplication = require('./job-application.model').JobApplication;
  Applicant.hasMany(JobApplication, {
    foreignKey: 'applicant_id',
    as: 'applications',
  });
}
