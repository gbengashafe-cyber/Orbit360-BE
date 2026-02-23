import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export const LEAVE_TYPES = [
  'annual',
  'compassionate',
  'study',
  'unpaid',
  'sick',
  'vacation',
  'personal',
  'maternity',
  'paternity',
];

export class Leave extends Model<InferAttributes<Leave>, InferCreationAttributes<Leave>> {
  declare id: CreationOptional<number>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare startDate: Date;
  declare endDate: Date;
  declare type: (typeof LEAVE_TYPES)[number];
  declare status: CreationOptional<'pending' | 'approved' | 'rejected'>;
  declare reason: CreationOptional<string | null>;
  declare leave_period: CreationOptional<string | null>;
  declare selected_supervisor_id: CreationOptional<number | null>;
  declare covering_employee_id: CreationOptional<number | null>;
  declare handover_notes: CreationOptional<string | null>;
  declare emergency_contact: CreationOptional<string | null>;
  declare alternative_email: CreationOptional<string | null>;
  declare rejection_reason: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Leave.init(
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
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM,
      values: LEAVE_TYPES,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leave_period: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'full_day',
    },
    selected_supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    covering_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    handover_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    alternative_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    modelName: 'Leave',
    tableName: 'leaves',
    timestamps: true,
  },
);

Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
