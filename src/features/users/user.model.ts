import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';

/* 
role (Built-in, System-level):

Values: admin or user
Purpose: Core system access level
admin = full platform access, can manage users, see all data
user = standard employee access, restricted to self-service features

job_role (Descriptive):

Values: Specific job titles (e.g., 'human_resources_manager', 'finance_officer', 'loan_officer')
Purpose: Defines what the person actually does in the organization
Used for UI display, reporting, and potentially mapping to permissions

department (Organizational):

Values: hr, finance, operations, it, sales, etc.
Purpose: Groups users by business unit
Used for filtering data, routing approvals,recr and reporting

In Practice:

A user might be role='user', job_role='human_resources_manager', department='hr', with permissions=['manage_employees', 'process_payroll', 'approve_leave_requests']
This gives them HR-specific access without full admin privileges
*/
export const userStatusOptions = ['active', 'inactive'] as const;
export const userRoleOptions = ['admin', 'user'] as const;

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  declare password: string;
  declare profileImage: CreationOptional<string>;
  declare googleId: CreationOptional<string>;
  // Defines what the user can do no the admin platform
  declare role: CreationOptional<(typeof userRoleOptions)[number]>;
  // Defines what the user does for the organization
  declare jobRole: ForeignKey<JobRole['title']>;
  declare department: ForeignKey<Department['name']>;
  declare status: CreationOptional<(typeof userStatusOptions)[number]>;
  declare lastLoginDate: CreationOptional<Date>;
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
    role: {
      type: DataTypes.ENUM,
      values: userRoleOptions,
      allowNull: false,
      defaultValue: 'user',
    },
    jobRole: {
      type: DataTypes.STRING(100),
      references: { model: JobRole, key: 'title' },
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
    lastLoginDate: {
      type: DataTypes.DATE,
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
