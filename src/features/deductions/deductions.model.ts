import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';

export class Deduction extends Model<InferAttributes<Deduction>, InferCreationAttributes<Deduction>> {
  declare id: CreationOptional<number>;
  declare type: string;
  declare rate: number;
  declare isPercentage: boolean;
  declare isOptional: boolean;
}

Deduction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      set(value: string) {
        this.setDataValue('type', value.toUpperCase());
      },
    },
    rate: {
      type: DataTypes.DECIMAL(2),
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
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'deductions',
  },
);
