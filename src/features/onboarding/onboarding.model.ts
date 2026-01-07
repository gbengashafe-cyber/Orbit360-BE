import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface OnboardingAttributes {
  id?: number;
  employeeId: number;
  startDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: number;
  completionDate?: Date;
  notes?: string;
}

export class Onboarding extends Model<OnboardingAttributes> implements OnboardingAttributes {
  public id!: number;
  public employeeId!: number;
  public startDate!: Date;
  public status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  public assignedTo!: number;
  public completionDate!: Date;
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completionDate: {
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
