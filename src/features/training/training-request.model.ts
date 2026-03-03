import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';

export const TrainingRequestStatus = [
  'PENDING_SUPERVISOR_APPROVAL',
  'SUPERVISOR_REJECTED',
  'PENDING_HR_REVIEW',
  'HR_REJECTED',
  'PENDING_HR_APPROVAL',
  'APPROVED',
  'REJECTED',
];

export const DeliveryMethod = ['ONLINE', 'IN_PERSON', 'HYBRID'];

export const TrainingPriority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const RequestScope = ['SELF', 'TEAM'] as const;

export const TRAINING_TYPES = [
  'TECHNICAL SKILLS',
  'SOFT SKILLS',
  'LEADERSHIP',
  'COMPLIANCE',
  'CERTIFICATION',
  'PROFESSIONAL DEVELOPMENT',
  'OTHER',
] as const;

export class TrainingRequest extends Model<InferAttributes<TrainingRequest>, InferCreationAttributes<TrainingRequest>> {
  declare id: CreationOptional<string>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare trainingType: (typeof TRAINING_TYPES)[number];
  declare trainingTitle: string;
  declare trainingDescription: string;
  declare priority: (typeof TrainingPriority)[number];
  declare businessJustification: string;
  declare skillsToGain: string;
  declare deliveryMethod: (typeof DeliveryMethod)[number];
  declare preferredTimeframe: string;
  declare estimatedDuration: string;
  declare estimatedCost: number;
  declare trainingProvider: string;
  declare requestScope: (typeof RequestScope)[number];
  declare numberOfTeamMembers: CreationOptional<number>;
  declare teamMemberIds: CreationOptional<number[]>;
  declare status: CreationOptional<(typeof TrainingRequestStatus)[number]>;
  declare supervisorApprovedAt: CreationOptional<Date>;
  declare supervisorApprovedBy: CreationOptional<ForeignKey<User['id']>>;
  declare supervisorNote: CreationOptional<string>;
  declare hrReviewedAt: CreationOptional<Date>;
  declare hrReviewedBy: CreationOptional<ForeignKey<User['id']>>;
  declare hrReviewerNote: CreationOptional<string>;
  declare finalApprovedAt: CreationOptional<Date>;
  declare finalApprovedBy: CreationOptional<ForeignKey<User['id']>>;
  declare finalNote: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TrainingRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Employee, key: 'id' },
    },
    trainingType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trainingTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trainingDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...TrainingPriority),
    },
    businessJustification: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    skillsToGain: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deliveryMethod: {
      type: DataTypes.ENUM(...Object.values(DeliveryMethod)),
      allowNull: false,
    },
    preferredTimeframe: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estimatedDuration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estimatedCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    trainingProvider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requestScope: {
      type: DataTypes.ENUM(...RequestScope),
      defaultValue: 'SELF',
    },
    numberOfTeamMembers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    teamMemberIds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...TrainingRequestStatus),
      defaultValue: 'PENDING_SUPERVISOR_APPROVAL',
    },
    supervisorApprovedAt: {
      type: DataTypes.DATE,
    },
    supervisorApprovedBy: {
      type: DataTypes.INTEGER,
    },
    supervisorNote: {
      type: DataTypes.TEXT,
    },
    hrReviewedAt: {
      type: DataTypes.DATE,
    },
    hrReviewedBy: {
      type: DataTypes.INTEGER,
    },
    hrReviewerNote: {
      type: DataTypes.TEXT,
    },
    finalApprovedAt: {
      type: DataTypes.DATE,
    },
    finalApprovedBy: {
      type: DataTypes.INTEGER,
    },
    finalNote: {
      type: DataTypes.TEXT,
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  },
  {
    sequelize: db,
    timestamps: true,
  },
);

TrainingRequest.belongsTo(Employee, { foreignKey: 'employeeId' });
Employee.hasMany(TrainingRequest, { foreignKey: 'employeeId' });

TrainingRequest.belongsTo(User, { foreignKey: 'supervisorApprovedBy', as: 'supervisorApprover' });
User.hasMany(TrainingRequest, { foreignKey: 'supervisorApprovedBy' });

TrainingRequest.belongsTo(User, { foreignKey: 'hrReviewedBy', as: 'hrReviewer' });
User.hasMany(TrainingRequest, { foreignKey: 'hrReviewedBy' });

TrainingRequest.belongsTo(User, { foreignKey: 'finalApprovedBy', as: 'hrApprover' });
User.hasMany(TrainingRequest, { foreignKey: 'finalApprovedBy' });
