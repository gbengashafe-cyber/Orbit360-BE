import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';

export class Deduction extends Model<InferAttributes<Deduction>, InferCreationAttributes<Deduction>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare annualRate: number;
  declare isPercentage: boolean;
  declare isOptional: boolean;
  declare optionalFieldLink: string;
  declare compensationFields: string;
  declare status: boolean;
}

Deduction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'active_deduction',
      set(value: string) {
        this.setDataValue('name', value.toUpperCase());
      },
    },
    annualRate: {
      type: DataTypes.DECIMAL(12, 5),
      allowNull: false,
    },
    isPercentage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    optionalFieldLink: { type: DataTypes.STRING(50) },
    compensationFields: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      unique: 'active_deduction',
    },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'deductions',
  },
);
