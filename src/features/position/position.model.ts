import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface PositionAttributes {
  id?: number;
  title: string;
  description?: string;
}

export class Position extends Model<PositionAttributes> implements PositionAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
}

Position.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'title',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: 'positions',
  },
);
