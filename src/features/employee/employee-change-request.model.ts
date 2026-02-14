import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { Employee } from './employee.model';

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
  declare status: CreationOptional<(typeof changeRequestStatus)[number]>;
  declare requesterComment: CreationOptional<string>;
  declare reviewerComment: CreationOptional<string>;
  declare reviewedDate: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
}

EmployeeChangeRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    actionType: { type: DataTypes.ENUM(...ACTION_TYPES), allowNull: false },
    employeeId: { type: DataTypes.INTEGER, references: { model: Employee, key: 'id' } },
    requestedBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
    reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'id' } },
    status: { type: DataTypes.ENUM(...changeRequestStatus), defaultValue: 'PENDING_APPROVAL' },
    requesterComment: { type: DataTypes.TEXT },
    reviewerComment: { type: DataTypes.TEXT },
    createdAt: DataTypes.DATE,
    reviewedDate: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize: db,
    tableName: 'employee_change_requests',
    timestamps: true,
    updatedAt: 'reviewedDate',
    indexes: [{ fields: ['employee_id'] }, { fields: ['requested_by'] }, { fields: ['reviewed_by'] }, { fields: ['status'] }],
  },
);
