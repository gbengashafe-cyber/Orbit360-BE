import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { Employee } from './employee.model';
import { EmployeeFieldChange } from './employee-field-change.model';

export const changeRequestStatus = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const;
export const ACTION_TYPES = ['CREATE', 'UPDATE'] as const;

export class EmployeeChangeRequest extends Model<
  InferAttributes<EmployeeChangeRequest>,
  InferCreationAttributes<EmployeeChangeRequest>
> {
  declare id: CreationOptional<number>;
  declare actionType: (typeof ACTION_TYPES)[number];
  declare employeeId: CreationOptional<number>;
  declare requestedBy: number;
  declare reviewedBy: CreationOptional<number>;
  declare status: (typeof changeRequestStatus)[number];
  declare makerComment: CreationOptional<string>;
  declare reviewerComment: CreationOptional<string>;
  declare reviewedDate: CreationOptional<Date>;
  declare createdAt: Date;

  declare fieldChanges: NonAttribute<EmployeeFieldChange[]>;
}

EmployeeChangeRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actionType: {
      type: DataTypes.ENUM(...ACTION_TYPES),
      allowNull: false,
      defaultValue: 'UPDATE',
    },
    employeeId: { type: DataTypes.INTEGER, defaultValue: null, references: { model: Employee, key: 'id' } },
    requestedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'id' } },
    status: { type: DataTypes.ENUM(...changeRequestStatus), defaultValue: 'PENDING_APPROVAL' },
    makerComment: { type: DataTypes.TEXT },
    reviewerComment: { type: DataTypes.TEXT },
    createdAt: { type: DataTypes.DATE },
    reviewedDate: DataTypes.DATE,
  },
  {
    sequelize: db,
    tableName: 'employee_change_requests',
    underscored: true,
    indexes: [{ fields: ['employee_id'] }, { fields: ['requested_by'] }, { fields: ['reviewed_by'] }, { fields: ['status'] }],
    timestamps: true,
    updatedAt: false,
  },
);
