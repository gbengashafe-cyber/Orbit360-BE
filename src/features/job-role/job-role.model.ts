import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';

export class JobRole extends Model<InferAttributes<JobRole>, InferCreationAttributes<JobRole>> {
  public id!: CreationOptional<number>;
  public title!: string;
  public description!: CreationOptional<string>;
}

JobRole.init(
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
      set(value: string) {
        this.setDataValue('title', value.toUpperCase());
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: 'job_roles',
  },
);
