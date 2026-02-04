import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { EmployeeChangeRequest } from './employee-change-request.model';
import { Employee } from './employee.model';

export class EmployeeFieldChange extends Model<
  InferAttributes<EmployeeFieldChange>,
  InferCreationAttributes<EmployeeFieldChange>
> {
  declare id: CreationOptional<number>;
  declare requestId: number;
  declare fieldName: string;
  declare oldValue: CreationOptional<string | null>;
  declare newValue: CreationOptional<string | null>;
}

EmployeeFieldChange.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER, references: { model: EmployeeChangeRequest, key: 'id' } },
    fieldName: { type: DataTypes.STRING(50), allowNull: false },
    oldValue: { type: DataTypes.TEXT, allowNull: true },
    newValue: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize: db,
    tableName: 'employee_field_changes',
    timestamps: false,
    underscored: true,
    indexes: [{ fields: ['request_id'] }],
  },
);

EmployeeChangeRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(EmployeeChangeRequest, { foreignKey: 'employeeId', as: 'changeRequests' });

EmployeeChangeRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'maker' });
EmployeeChangeRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'checker' });

EmployeeFieldChange.belongsTo(EmployeeChangeRequest, { foreignKey: 'requestId', as: 'request' });
EmployeeChangeRequest.hasMany(EmployeeFieldChange, {
  foreignKey: 'requestId',
  as: 'fieldChanges',
  onDelete: 'CASCADE',
});
