import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Company } from '../company/company.model';

export interface DepartmentAttributes {
  id?: number;
  name: string;
  description?: string;
  companyId?: number;
}

export class Department extends Model<DepartmentAttributes> implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'name',
      set(value: string) {
        this.setDataValue('name', value.toUpperCase());
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'departments',
  },
);

Department.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false }, as: 'company' });
Company.hasMany(Department, { foreignKey: { name: 'companyId', allowNull: false }, as: 'companies' });
