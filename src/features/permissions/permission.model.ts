import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { JobRole } from '../job-role/job-role.model';

class JobRolePermissions extends Model<InferAttributes<JobRolePermissions>, InferCreationAttributes<JobRolePermissions>> {
  declare id: CreationOptional<number>;
  declare jobRole: ForeignKey<JobRole['title']>;
  declare permission: string;
}

JobRolePermissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jobRole: {
      type: DataTypes.STRING(100),
      unique: 'role_permission',
    },
    permission: {
      type: DataTypes.STRING(50),
      unique: 'role_permission',
    },
  },
  { sequelize: db, underscored: true },
);

JobRolePermissions.belongsTo(JobRole, { foreignKey: 'jobRole', targetKey: 'title' });
JobRole.hasMany(JobRolePermissions, { foreignKey: 'jobRole', sourceKey: 'title' });

export { JobRolePermissions };
