import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Company } from '../company/company.model';
import { User } from '../users/user.model';

export const PAYROLL_BATCH_STATUS = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'PENDING_OVERRIDE_APPROVAL',
  'OVERRIDE_APPROVED',
] as const;

export class PayrollBatch extends Model<InferAttributes<PayrollBatch>, InferCreationAttributes<PayrollBatch>> {
  declare id: CreationOptional<number>;
  declare companyId: ForeignKey<Company['id']>;
  declare batchId: string;
  declare payPeriod: string;
  declare totalGross: number;
  declare totalNet: number;
  declare recordCount: number;
  declare status: (typeof PAYROLL_BATCH_STATUS)[number];
  declare createdBy: ForeignKey<User['id']>;
  declare reviewedBy: CreationOptional<ForeignKey<User['id']>>;
  declare approverNote: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare approvalDate: CreationOptional<Date>;
}

PayrollBatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Company, key: 'id' } },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'batchId',
    },
    payPeriod: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    totalGross: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    totalNet: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    recordCount: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM,
      values: PAYROLL_BATCH_STATUS,
      defaultValue: 'PENDING_APPROVAL',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    approverNote: { type: DataTypes.STRING(1000) },
    createdAt: DataTypes.DATE,
    approvalDate: { type: DataTypes.DATE },
  },
  {
    sequelize: db,
    tableName: 'payroll_batches',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['pay_period', 'company_id'], name: 'company_pay_period_idx' }],
  },
);

PayrollBatch.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false }, as: 'company' });
Company.hasMany(PayrollBatch, { foreignKey: { name: 'companyId', allowNull: false } });

PayrollBatch.belongsTo(User, { foreignKey: 'createdBy', as: 'initiator' });
PayrollBatch.belongsTo(User, { foreignKey: 'reviewedBy', as: 'approver' });
