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
      allowNull: false,
      unique: 'job_role_permission_idx',
      set(value: string) {
        this.setDataValue('jobRole', value.toUpperCase());
      },
    },
    permission: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: 'job_role_permission_idx',
    },
  },
  {
    sequelize: db,
    underscored: true,
    tableName: 'job_role_permissions',
    indexes: [
      {
        unique: true,
        fields: ['job_role', 'permission'],
      },
    ],
  },
);

JobRolePermissions.belongsTo(JobRole, { foreignKey: 'jobRole', targetKey: 'title', as: 'roleObj' });
JobRole.hasMany(JobRolePermissions, { foreignKey: 'jobRole', sourceKey: 'title', as: 'permissions' });

export { JobRolePermissions };
