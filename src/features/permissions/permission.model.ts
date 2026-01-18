import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { JobRole } from '../job-role/job-role.model';

class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string>;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'name',
    },
    description: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'permissions',
  },
);

class JobRolePermissions extends Model<InferAttributes<JobRolePermissions>, InferCreationAttributes<JobRolePermissions>> {
  declare id: CreationOptional<number>;
  declare jobRole: ForeignKey<JobRole['title']>;
  declare permission: ForeignKey<Permission['name']>;
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

Permission.belongsToMany(JobRole, {
  through: JobRolePermissions,
  sourceKey: 'name',
  foreignKey: 'permission',
  targetKey: 'title',
  otherKey: 'job_role',
});
JobRole.belongsToMany(Permission, {
  through: JobRolePermissions,
  sourceKey: 'title',
  foreignKey: 'job_role',
  targetKey: 'name',
  otherKey: 'permission',
});

JobRolePermissions.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'name' });
Permission.hasMany(JobRolePermissions, { foreignKey: 'permission', sourceKey: 'name' });

JobRolePermissions.belongsTo(JobRole, { foreignKey: 'jobRole', targetKey: 'title' });
JobRole.hasMany(JobRolePermissions, { foreignKey: 'jobRole', sourceKey: 'title' });

export { JobRolePermissions, Permission };
