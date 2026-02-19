import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Company } from '../company/company.model';

export class Department extends Model<InferAttributes<Department>, InferCreationAttributes<Department>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare companyId: ForeignKey<Company['id']>;
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
      set(value: string) {
        this.setDataValue('name', value.toUpperCase());
      },
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: 'departments',
    modelName: 'department',
    indexes: [{ unique: true, fields: ['name'] }],
  },
);

Department.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false }, as: 'company' });
Company.hasMany(Department, { foreignKey: { name: 'companyId', allowNull: false }, as: 'departments' });
