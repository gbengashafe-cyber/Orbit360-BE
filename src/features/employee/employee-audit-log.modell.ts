import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { EmployeesTemp } from './employee-temp.modell';
import { Employee } from './employee.model';

export class EmployeeAuditLog extends Model<InferAttributes<EmployeeAuditLog>, InferCreationAttributes<EmployeeAuditLog>> {
  declare id: CreationOptional<number>;
  declare employeeId: string;
  declare action: 'create' | 'update' | 'delete';
  declare fieldName: string;
  declare oldValue: string | null;
  declare newValue: string | null;
  declare changedById: ForeignKey<User['id']>;
  declare approvedById: ForeignKey<User['id']> | null;
  declare employeesTempId: number | null;
  declare timestamp: Date;
  declare ipAddress: string | null;
  declare userAgent: string | null;

  declare createdAt: CreationOptional<Date>;
}

EmployeeAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' },
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    fieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    employeesTempId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'employees_temp', key: 'id' },
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    tableName: 'employee_audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  },
);

// Relationships
EmployeeAuditLog.belongsTo(Employee, {
  foreignKey: 'employeeId',
  targetKey: 'employeeId',
  as: 'employee',
});

EmployeeAuditLog.belongsTo(EmployeesTemp, {
  foreignKey: 'employeesTempId',
  as: 'employeesTemp',
});

EmployeeAuditLog.belongsTo(User, { foreignKey: 'changedById', as: 'changedBy' });
EmployeeAuditLog.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
