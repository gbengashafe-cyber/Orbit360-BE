import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface OnboardingAttributes {
  id?: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  documentUrl?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedBy?: number;
  reviewedAt?: Date;
  notes?: string;
}

export class Onboarding extends Model<OnboardingAttributes> implements OnboardingAttributes {
  public id!: number;
  public employeeId!: number;
  public documentType!: string;
  public documentName!: string;
  public documentUrl!: string;
  public status!: 'pending' | 'submitted' | 'approved' | 'rejected';
  public submittedAt!: Date;
  public reviewedBy!: number;
  public reviewedAt!: Date;
  public notes!: string;
}

Onboarding.init(
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
    documentType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    documentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    documentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Onboarding',
    tableName: 'onboardings',
  },
);

Onboarding.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Onboarding, { foreignKey: 'employeeId', as: 'onboardings' });
