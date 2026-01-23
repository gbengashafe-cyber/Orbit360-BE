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
      allowNull: false,
      unique: 'role_permission',
      set(value: string) {
        this.setDataValue('jobRole', value.toUpperCase());
      },
    },
    permission: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'role_permission',
    },
  },
  { sequelize: db, underscored: true, tableName: 'job_role_permissions' },
);

// Define associations AFTER both models are initialized
JobRolePermissions.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'name', as: 'permissionObj' });
Permission.hasMany(JobRolePermissions, { foreignKey: 'permission', sourceKey: 'name', as: 'rolePermissions' });

JobRolePermissions.belongsTo(JobRole, { foreignKey: 'jobRole', targetKey: 'title', as: 'roleObj' });
JobRole.hasMany(JobRolePermissions, { foreignKey: 'jobRole', sourceKey: 'title', as: 'permissions' });

export { JobRolePermissions, Permission };
