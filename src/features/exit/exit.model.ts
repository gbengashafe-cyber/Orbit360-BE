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

export class Exit extends Model<InferAttributes<Exit>, InferCreationAttributes<Exit>> {
  public id!: string;
  public employeeId!: number;
  declare employee?: NonAttribute<Employee>;
  public resignationDate!: Date;
  public lastWorkingDate!: Date;
  public noticePeriod!: number;
  public status!: 'submitted' | 'under_review' | 'clearance_pending' | 'approved' | 'completed' | 'rejected' | 'withdrawn';
  public handoverStatus!: 'in_progress' | 'yes' | 'no';
  public handoverDetails!: string;
  public handoverRecipientName!: string;
  public handoverRecipientContact!: string;
  public outstandingTasks!: string;
  public outstandingApprovals!: string;
  public assetsToReturn!: string;
  public assetReturnStatus!: 'not_applicable' | 'pending_return' | 'returned';
  public salaryBalanceNotes!: string;
  public loanDeductionNotes!: string;
  public leaveEncashmentRequest!: boolean;
  public pensionProcessingNotes!: string;
  public overallExperienceRating!: number;
  public positiveExperience!: string;
  public areasForImprovementOrg!: string;
  public wouldRecommendOrg!: boolean;
  public supervisorApprovalDate!: Date;
  public supervisorComments!: string;
  public itAdminClearance!: boolean;
  public supervisorClearance!: boolean;
  public financeClearance!: boolean;
  public hrClearance!: boolean;
  declare reviewerId: ForeignKey<User['id']>;
  declare reviewerDate: CreationOptional<Date>;
  declare reviewerComment: CreationOptional<string>;
  public itClearanceStatus!: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  public itClearanceDate!: Date;
  public itComments!: string;
  public finalApprovalStatus!: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  public finalApprovalDate!: Date;
  public finalApprovalBy!: string;
  public finalComments!: string;
  public employeeSignatureDate!: Date;
}

Exit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    resignationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lastWorkingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    noticePeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('submitted', 'under_review', 'clearance_pending', 'approved', 'completed', 'rejected', 'withdrawn'),
      defaultValue: 'submitted',
    },
    handoverStatus: {
      type: DataTypes.ENUM('in_progress', 'yes', 'no'),
      allowNull: true,
    },
    handoverDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    handoverRecipientName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    handoverRecipientContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    outstandingTasks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    outstandingApprovals: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assetsToReturn: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assetReturnStatus: {
      type: DataTypes.ENUM('not_applicable', 'pending_return', 'returned', 'not_returned'),
      allowNull: true,
      defaultValue: 'pending_return',
    },
    salaryBalanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    loanDeductionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leaveEncashmentRequest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pensionProcessingNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    overallExperienceRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    positiveExperience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    areasForImprovementOrg: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    wouldRecommendOrg: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    supervisorApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supervisorComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    itAdminClearance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    supervisorClearance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    financeClearance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hrClearance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reviewerId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
    reviewerDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewerComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    itClearanceStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'cleared', 'rejected', 'issues'),
      defaultValue: 'pending',
    },
    itClearanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    itComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    finalApprovalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'cleared', 'rejected', 'issues'),
      defaultValue: 'pending',
    },
    finalApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    finalApprovalBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    finalComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    employeeSignatureDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Exit',
    tableName: 'exits',
    timestamps: true,
  },
);

Exit.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Exit, { foreignKey: 'employeeId', as: 'exits' });

Exit.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(Exit, { foreignKey: 'reviewerId' });
