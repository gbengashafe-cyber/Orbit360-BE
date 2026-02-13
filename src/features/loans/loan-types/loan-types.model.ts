import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../../db';

export class LoanType extends Model<InferAttributes<LoanType>, InferCreationAttributes<LoanType>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare interestRate: number;
  declare maxTenureMonths: number;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

LoanType.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    maxTenureMonths: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  },
  {
    sequelize: db,
    tableName: 'loan_types',
    underscored: true,
    modelName: 'loanType',
    indexes: [{ unique: true, fields: ['name'] }],
  },
);
