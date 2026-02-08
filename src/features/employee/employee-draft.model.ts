import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { EmployeeChangeRequest } from './employee-change-request.model';
import { EmployeeFields } from './employee-schema';
import { Employee, employeeStatus } from './employee.model';

export class EmployeeDraft extends Model<InferAttributes<EmployeeDraft>, InferCreationAttributes<EmployeeDraft>> {
  declare id: CreationOptional<number>;
  declare requestId: ForeignKey<number>;
  declare status: (typeof employeeStatus)[number];
  declare email: string;
  declare previousStatus: (typeof employeeStatus)[number];
}

EmployeeDraft.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employee_change_requests', key: 'id' },
      onDelete: 'CASCADE',
    },
    previousStatus: { type: DataTypes.STRING(20), allowNull: false },
    ...EmployeeFields,
  },
  {
    sequelize: db,
    tableName: 'employee_drafts',
    underscored: true,
    timestamps: true,
  },
);

EmployeeDraft.belongsTo(Employee, { foreignKey: 'supervisorId', as: 'draftSupervisor' });

EmployeeDraft.belongsTo(EmployeeChangeRequest, { foreignKey: 'requestId', as: 'request' });
EmployeeChangeRequest.hasOne(EmployeeDraft, { foreignKey: 'requestId', as: 'employeeDraft' });

EmployeeChangeRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(EmployeeChangeRequest, { foreignKey: 'employeeId', as: 'changeRequests' });

EmployeeChangeRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'initiator' });
User.hasMany(EmployeeChangeRequest, { foreignKey: 'requestedBy', as: 'initiatedRequests' });

EmployeeChangeRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(EmployeeChangeRequest, { foreignKey: 'reviewedBy', as: 'reviewedRequests' });
