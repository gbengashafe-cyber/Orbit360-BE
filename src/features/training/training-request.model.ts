import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export enum TrainingRequestStatus {
  PENDING = 'PENDING',
  SUPERVISOR_APPROVED = 'SUPERVISOR_APPROVED',
  SUPERVISOR_REJECTED = 'SUPERVISOR_REJECTED',
  HR_REVIEWING = 'HR_REVIEWING',
  HR_APPROVED = 'HR_APPROVED',
  HR_REJECTED = 'HR_REJECTED',
  FINAL_APPROVED = 'FINAL_APPROVED',
  FINAL_REJECTED = 'FINAL_REJECTED',
}

export enum DeliveryMethod {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON',
  HYBRID = 'HYBRID',
  SELF_PACED = 'SELF_PACED',
}

export enum TrainingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RequestScope {
  SELF = 'SELF',
  TEAM = 'TEAM',
}

export class TrainingRequest extends Model<InferAttributes<TrainingRequest>, InferCreationAttributes<TrainingRequest>> {
  declare id: CreationOptional<string>;
  declare requesterId: Employee['id'];
  declare supervisorId: CreationOptional<Employee['id']>;
  declare trainingType: string;
  declare trainingTitle: string;
  declare trainingDescription: string;
  declare priority: TrainingPriority;
  declare businessJustification: string;
  declare skillsToGain: string;
  declare deliveryMethod: DeliveryMethod;
  declare preferredTimeframe: string;
  declare estimatedDuration: string;
  declare estimatedCost: number;
  declare trainingProvider: string;
  declare requestScope: RequestScope;
  declare numberOfTeamMembers: number;
  declare teamMemberIds: number[];
  declare status: TrainingRequestStatus;
  declare supervisorApprovedAt: Date;
  declare supervisorApprovedBy: number;
  declare supervisorRejectionReason: string;
  declare hrApprovedAt: Date;
  declare hrApprovedBy: number;
  declare hrRejectionReason: string;
  declare finalApprovedAt: Date;
  declare finalApprovedBy: number;
  declare finalRejectionReason: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

TrainingRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Employee, key: 'id' },
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
      type: DataTypes.ENUM(...Object.values(TrainingPriority)),
      defaultValue: TrainingPriority.MEDIUM,
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
      type: DataTypes.ENUM(...Object.values(RequestScope)),
      defaultValue: RequestScope.SELF,
    },
    numberOfTeamMembers: {
      type: DataTypes.INTEGER,
    },
    teamMemberIds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TrainingRequestStatus)),
      defaultValue: TrainingRequestStatus.PENDING,
    },
    supervisorApprovedAt: {
      type: DataTypes.DATE,
    },
    supervisorApprovedBy: {
      type: DataTypes.INTEGER,
    },
    supervisorRejectionReason: {
      type: DataTypes.TEXT,
    },
    hrApprovedAt: {
      type: DataTypes.DATE,
    },
    hrApprovedBy: {
      type: DataTypes.INTEGER,
    },
    hrRejectionReason: {
      type: DataTypes.TEXT,
    },
    finalApprovedAt: {
      type: DataTypes.DATE,
    },
    finalApprovedBy: {
      type: DataTypes.INTEGER,
    },
    finalRejectionReason: {
      type: DataTypes.TEXT,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    timestamps: true,
  },
);

TrainingRequest.belongsTo(Employee, { foreignKey: 'requesterId' });
Employee.hasMany(TrainingRequest, { foreignKey: 'requesterId' });

TrainingRequest.belongsTo(Employee, { foreignKey: { name: 'supervisorId', allowNull: true } });
Employee.hasMany(TrainingRequest, { foreignKey: 'supervisorId' });
