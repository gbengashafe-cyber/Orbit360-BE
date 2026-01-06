import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { Position } from '../position/position.model';

const userStatusOptions = ['active', 'inactive'] as const;

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  declare profileImage: CreationOptional<string>;
  declare googleId: CreationOptional<string>;
  // Defines what the user can do no the admin platform
  declare systemRole: CreationOptional<'admin' | 'user'>;
  // Defines what the user does for the organization
  declare position: ForeignKey<Position['title']>;
  declare departmentName: ForeignKey<Department['name']>;
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
    // Determines if the user is a system admin or a regular user (self-service)
    systemRole: { type: DataTypes.ENUM, values: ['admin', 'user'], defaultValue: 'user' },
    status: {
      type: DataTypes.ENUM,
      values: userStatusOptions,
      defaultValue: 'active',
    },
  },
  {
    sequelize: db,
    tableName: 'users',
    underscored: true,
  },
);

User.belongsTo(Position, { foreignKey: { name: 'position', allowNull: false }, targetKey: 'title' });
Position.hasMany(User, { foreignKey: { name: 'position', allowNull: false }, sourceKey: 'title' });

User.belongsTo(Department, { foreignKey: { name: 'departmentName', allowNull: false }, targetKey: 'name' });
Department.hasMany(User, { foreignKey: { name: 'departmentName', allowNull: false }, sourceKey: 'name' });

export { userStatusOptions };
