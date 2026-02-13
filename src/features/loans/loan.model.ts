import { addMonths, format } from 'date-fns';
import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';
import { LoanType } from './loan-types/loan-types.model';

export const loanStatus = [
  'PENDING_REVIEW',
  'PENDING_APPROVAL',
  'PENDING_DISBURSEMENT',
  'ACTIVE',
  'PAID_OFF',
  'REJECTED',
  'CANCELLED',
] as const;

export const reviewerDecisionOptions = ['APPROVE', 'REJECT'];

export class Loan extends Model<InferAttributes<Loan>, InferCreationAttributes<Loan>> {
  declare id: CreationOptional<number>;
  declare employeeId: ForeignKey<Employee['id']>;
  declare loanTypeId: ForeignKey<LoanType['id']>;
  declare principalAmount: number;
  declare interestRate: number;
  declare tenureMonths: number;
  declare startDate: Date;
  declare endDate: CreationOptional<string>;
  declare reviewedBy: ForeignKey<User['id']>;
  declare reviewerDecision: (typeof reviewerDecisionOptions)[number];
  declare reviewerNote: string;
  declare approverNote: string;
  declare employeeNote: string;
  declare approvedBy: ForeignKey<User['id']>;
  declare approvedDate: Date;
  declare status: (typeof loanStatus)[number];
  declare nextStep: (typeof loanStatus)[number];
  declare createdAt: Date;
}

Loan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      references: { model: Employee, key: 'id' },
      allowNull: false,
    },
    loanTypeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: LoanType } },
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    tenureMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: 'id' },
    },
    reviewerDecision: { type: DataTypes.ENUM(...reviewerDecisionOptions), allowNull: true },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: 'id' },
    },
    approvedDate: {
      type: DataTypes.DATEONLY,
    },
    reviewerNote: {
      type: DataTypes.STRING(300),
    },
    approverNote: {
      type: DataTypes.STRING(300),
    },
    employeeNote: {
      type: DataTypes.STRING(300),
    },
    status: {
      type: DataTypes.ENUM,
      values: loanStatus,
      defaultValue: 'PENDING_REVIEW',
    },
    nextStep: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    createdAt: { type: DataTypes.DATE },

    endDate: {
      type: DataTypes.VIRTUAL,
      get() {
        const startDate = this.getDataValue('startDate');
        const tenureMonths = this.getDataValue('tenureMonths');

        if (startDate && tenureMonths) {
          const endDate = addMonths(new Date(startDate), tenureMonths);

          return format(endDate, 'yyyy-MM-dd');
        }
        return null;
      },
    },
  },
  {
    sequelize: db,
    tableName: 'loans',
    timestamps: true,
  },
);

Loan.belongsTo(LoanType, { foreignKey: 'loanTypeId' });
LoanType.hasMany(Loan, { foreignKey: 'loanTypeId' });

Loan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Loan, { foreignKey: 'employeeId', as: 'loans' });

Loan.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
User.hasMany(Loan, { foreignKey: 'approvedBy', as: 'approvedLoans' });

Loan.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(Loan, { foreignKey: 'reviewedBy', as: 'reviewedLoans' });
