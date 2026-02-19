import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { JobRole } from '../job-role/job-role.model';

class JobRolePermissions extends Model<InferAttributes<JobRolePermissions>, InferCreationAttributes<JobRolePermissions>> {
  declare id: CreationOptional<number>;
  declare jobRoleId: ForeignKey<JobRole['id']>;
  declare permission: string;
}

JobRolePermissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jobRoleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: 'job_role_permissions',
    indexes: [
      {
        unique: true,
        fields: ['job_role_id', 'permission'],
      },
    ],
    timestamps: false,
  },
);

JobRolePermissions.belongsTo(JobRole, { foreignKey: 'jobRoleId', as: 'roleObj' });
JobRole.hasMany(JobRolePermissions, { foreignKey: 'jobRoleId', as: 'permissions' });

export { JobRolePermissions };
