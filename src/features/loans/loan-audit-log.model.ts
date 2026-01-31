import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, ForeignKey } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { Loan } from './loan.model';

const AUDIT_LOG_ACTIONS = ['CREATE', 'APPROVE', 'REJECT', 'DISBURSE'];

export class LoanAuditLog extends Model<InferAttributes<LoanAuditLog>, InferCreationAttributes<LoanAuditLog>> {
  declare id: CreationOptional<number>;
  declare loanId: ForeignKey<Loan['id']>;
  declare userId: ForeignKey<User['id']>;
  declare action: (typeof AUDIT_LOG_ACTIONS)[number];
  declare details: string;
  declare timestamp: CreationOptional<Date>;
}

LoanAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.INTEGER,
      references: { model: Loan, key: 'id' },
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: { model: User, key: 'id' },
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM,
      values: AUDIT_LOG_ACTIONS,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    tableName: 'loan_audit_logs',
    timestamps: false,
  },
);

LoanAuditLog.belongsTo(Loan, { foreignKey: 'loanId' });
LoanAuditLog.belongsTo(User, { foreignKey: 'userId' });
Loan.hasMany(LoanAuditLog, { foreignKey: 'loanId', as: 'auditLogs' });
