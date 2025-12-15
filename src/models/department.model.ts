import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export interface DepartmentAttributes {
  id?: number;
  name: string;
  description?: string;
}

export class Department extends Model<DepartmentAttributes> implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
}

Department.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize: db,
  modelName: 'Department',
  tableName: 'departments',
});