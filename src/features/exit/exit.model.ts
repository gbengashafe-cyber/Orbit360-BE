import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface ExitAttributes {
  id?: string;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  employeeDepartment?: string;
  position?: string;
  resignationDate: Date;
  lastWorkingDate: Date;
  noticePeriod?: number;
  status?: 'submitted' | 'under_review' | 'clearance_pending' | 'approved' | 'completed' | 'rejected' | 'withdrawn';
  handoverStatus?: 'in_progress' | 'yes' | 'no';
  handoverDetails?: string;
  handoverRecipientName?: string;
  handoverRecipientContact?: string;
  outstandingTasks?: string;
  outstandingApprovals?: string;
  assetsToReturn?: string;
  salaryBalanceNotes?: string;
  loanDeductionNotes?: string;
  leaveEncashmentRequest?: boolean;
  pensionProcessingNotes?: string;
  overallExperienceRating?: number;
  positiveExperience?: string;
  areasForImprovementOrg?: string;
  wouldRecommendOrg?: boolean;
  supervisorApprovalStatus?: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  supervisorApprovalDate?: Date;
  supervisorComments?: string;
  hrApprovalStatus?: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  hrApprovalDate?: Date;
  hrComments?: string;
  itClearanceStatus?: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  itClearanceDate?: Date;
  itComments?: string;
  finalApprovalStatus?: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  finalApprovalDate?: Date;
  finalApprovalBy?: string;
  finalComments?: string;
  employeeSignatureDate?: Date;
}

export class Exit extends Model<ExitAttributes> implements ExitAttributes {
  public id!: string;
  public employeeId!: number;
  public employeeName!: string;
  public employeeEmail!: string;
  public employeeDepartment!: string;
  public position!: string;
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
  public salaryBalanceNotes!: string;
  public loanDeductionNotes!: string;
  public leaveEncashmentRequest!: boolean;
  public pensionProcessingNotes!: string;
  public overallExperienceRating!: number;
  public positiveExperience!: string;
  public areasForImprovementOrg!: string;
  public wouldRecommendOrg!: boolean;
  public supervisorApprovalStatus!: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  public supervisorApprovalDate!: Date;
  public supervisorComments!: string;
  public hrApprovalStatus!: 'pending' | 'approved' | 'cleared' | 'rejected' | 'issues';
  public hrApprovalDate!: Date;
  public hrComments!: string;
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
    employeeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employeeEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employeeDepartment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
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
    supervisorApprovalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'cleared', 'rejected', 'issues'),
      defaultValue: 'pending',
    },
    supervisorApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supervisorComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hrApprovalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'cleared', 'rejected', 'issues'),
      defaultValue: 'pending',
    },
    hrApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hrComments: {
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
