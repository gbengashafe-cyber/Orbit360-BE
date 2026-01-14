import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';

const userStatusOptions = ['active', 'inactive'] as const;

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public role!: 'employee' | 'admin';
  public password!: string;
  declare profileImage: CreationOptional<string>;
  declare googleId: CreationOptional<string>;
  // Defines what the user can do no the admin platform
  declare systemRole: CreationOptional<'admin' | 'user'>;
  // Defines what the user does for the organization
  declare jobRole: ForeignKey<JobRole['title']>;
  declare department: ForeignKey<Department['name']>;
  declare status: CreationOptional<(typeof userStatusOptions)[number]>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'email',
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: 'googleId',
    },
    // User's application-level role (employee or admin)
    role: {
      type: DataTypes.ENUM('employee', 'admin'),
      allowNull: false,
      defaultValue: 'employee',
    },

    // Determines if the user is a system admin or a regular user (self-service)
    // admin = full platform access, can manage users, see all data
    // user = standard employee access, restricted to self-service features
    systemRole: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    jobRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      references: { model: Department, key: 'name' },
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize: db,
    tableName: 'users',
    underscored: true,
  },
);

User.belongsTo(JobRole, { foreignKey: { name: 'jobRole', allowNull: false }, targetKey: 'title', as: 'userJobRole' });
JobRole.hasMany(User, { foreignKey: { name: 'jobRole', allowNull: false }, sourceKey: 'title', as: 'users' });

User.belongsTo(Department, { foreignKey: { name: 'department', allowNull: false }, targetKey: 'name', as: 'userDepartment' });
Department.hasMany(User, { foreignKey: { name: 'department', allowNull: false }, sourceKey: 'name', as: 'users' });

export { userStatusOptions };
