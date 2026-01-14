import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';

export interface JobRoleAttributes {
  id?: number;
  title: string;
  description?: string;
}

export class JobRole extends Model<JobRoleAttributes> implements JobRoleAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
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
    tableName: 'job-roles',
  },
);
