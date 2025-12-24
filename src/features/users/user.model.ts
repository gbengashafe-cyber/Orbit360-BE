import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { Employee } from '../employee/employee.model';
import { Position } from '../position/position.model';

const userStatusOptions = ['active', 'inactive'];

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  declare profileImage: CreationOptional<string>;
  declare googleId: CreationOptional<string>;
  declare employeeId: ForeignKey<Employee['employeeId']>;
  declare systemRole: CreationOptional<'admin' | 'user'>;
  // Defines what the user does for the organization
  declare position: ForeignKey<Position['title']>;
  declare department: ForeignKey<Department['name']>;
  declare status: CreationOptional<'active' | 'suspended'>;
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

User.belongsTo(Department, { foreignKey: { name: 'department', allowNull: false }, targetKey: 'name' });
Department.hasMany(User, { foreignKey: { name: 'department', allowNull: false }, sourceKey: 'name' });

export { userStatusOptions };
