import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';

export class JobRole extends Model<InferAttributes<JobRole>, InferCreationAttributes<JobRole>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare departmentId: ForeignKey<Department['id']>;
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
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    departmentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Department, key: 'id' } },
  },
  {
    sequelize: db,
    tableName: 'job_roles',
    indexes: [{ unique: true, fields: ['title', 'department_id'] }, { fields: ['title'] }],
  },
);

JobRole.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: false }, as: 'jobRoleDepartment' });
Department.hasMany(JobRole, { foreignKey: { name: 'departmentId', allowNull: false }, as: 'departmentJobRoles' });
