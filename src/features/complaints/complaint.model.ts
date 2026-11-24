import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';

export const COMPLAINT_TYPES = ['harassment', 'discrimination', 'safety', 'wage_dispute', 'working_conditions', 'other'] as const;
export const COMPLAINT_URGENCY = ['low', 'medium', 'high', 'critical'] as const;

// Two-stage workflow: HR Officer review (MANAGE_COMPLAINTS) -> HR Manager authorization (APPROVE_COMPLAINTS).
export const COMPLAINT_STATUS = [
  'PENDING_REVIEW',
  'PENDING_APPROVAL',
  'REJECTED_BY_REVIEWER',
  'REJECTED_BY_APPROVER',
  'APPROVED',
] as const;

// Values used before the two-stage workflow. Kept in the column enum so existing rows stay valid.
export const LEGACY_COMPLAINT_STATUS = ['open', 'under_review', 'resolved', 'closed'] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUS)[number];

export class Complaint extends Model<InferAttributes<Complaint>, InferCreationAttributes<Complaint>> {
  declare id: CreationOptional<number>;
  declare reference: CreationOptional<string | null>;
  // Internal ownership. Never returned to reviewers for anonymous complaints.
  declare employeeId: ForeignKey<Employee['id']>;
  declare complaintType: (typeof COMPLAINT_TYPES)[number];
  declare title: string;
  declare description: string;
  declare severity: CreationOptional<(typeof COMPLAINT_URGENCY)[number]>;
  declare status: CreationOptional<ComplaintStatus | (typeof LEGACY_COMPLAINT_STATUS)[number]>;
  declare isAnonymous: CreationOptional<boolean>;
  declare incidentDate: CreationOptional<string | null>;
  declare witnesses: CreationOptional<string | null>;
  declare reportedDate: CreationOptional<Date>;

  declare reviewedBy: CreationOptional<ForeignKey<User['id']> | null>;
  declare reviewerNote: CreationOptional<string | null>;
  declare reviewedDate: CreationOptional<Date | null>;
  declare approvedBy: CreationOptional<ForeignKey<User['id']> | null>;
  declare approverNote: CreationOptional<string | null>;
  declare approvedDate: CreationOptional<Date | null>;

  // Legacy columns, kept so the model matches the table.
  declare reportedTo: CreationOptional<string | null>;
  declare resolutionNotes: CreationOptional<string | null>;
  declare resolvedDate: CreationOptional<Date | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare employee?: NonAttribute<Employee>;
  declare reviewer?: NonAttribute<User>;
  declare approver?: NonAttribute<User>;
}

Complaint.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reference: { type: DataTypes.STRING(20), allowNull: true, unique: 'complaints_reference_unique' },
    employeeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Employee, key: 'id' } },
    complaintType: { type: DataTypes.ENUM(...COMPLAINT_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    severity: { type: DataTypes.ENUM(...COMPLAINT_URGENCY), defaultValue: 'medium' },
    status: {
      type: DataTypes.ENUM(...COMPLAINT_STATUS, ...LEGACY_COMPLAINT_STATUS),
      allowNull: false,
      defaultValue: 'PENDING_REVIEW',
    },
    isAnonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    incidentDate: { type: DataTypes.DATEONLY, allowNull: true },
    witnesses: { type: DataTypes.TEXT, allowNull: true },
    reportedDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

    reviewedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'id' } },
    reviewerNote: { type: DataTypes.TEXT, allowNull: true },
    reviewedDate: { type: DataTypes.DATE, allowNull: true },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'id' } },
    approverNote: { type: DataTypes.TEXT, allowNull: true },
    approvedDate: { type: DataTypes.DATE, allowNull: true },

    reportedTo: { type: DataTypes.STRING(255), allowNull: true },
    resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
    resolvedDate: { type: DataTypes.DATE, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    modelName: 'Complaint',
    tableName: 'complaints',
  },
);

Complaint.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Complaint.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
Complaint.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
