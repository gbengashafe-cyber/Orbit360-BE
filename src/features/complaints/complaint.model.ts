import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface ComplaintAttributes {
  id?: number;
  employee_id: number;
  complaint_type: 'harassment' | 'discrimination' | 'safety' | 'wage_dispute' | 'working_conditions' | 'other';
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_date: Date;
  reported_to?: string;
  resolution_notes?: string;
  resolved_date?: Date;
}

export class Complaint extends Model<ComplaintAttributes> implements ComplaintAttributes {
  public id!: number;
  public employee_id!: number;
  public complaint_type!: 'harassment' | 'discrimination' | 'safety' | 'wage_dispute' | 'working_conditions' | 'other';
  public title!: string;
  public description!: string;
  public status!: 'open' | 'under_review' | 'resolved' | 'closed';
  public severity!: 'low' | 'medium' | 'high' | 'critical';
  public reported_date!: Date;
  public reported_to!: string;
  public resolution_notes!: string;
  public resolved_date!: Date;
}

Complaint.init(
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
    complaint_type: {
      type: DataTypes.ENUM('harassment', 'discrimination', 'safety', 'wage_dispute', 'working_conditions', 'other'),
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
    status: {
      type: DataTypes.ENUM('open', 'under_review', 'resolved', 'closed'),
      defaultValue: 'open',
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    reported_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reported_to: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolved_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Complaint',
    tableName: 'complaints',
  }
);
