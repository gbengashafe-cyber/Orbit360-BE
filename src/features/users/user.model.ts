import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface UserAttributes {
  id?: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  googleId?: string;
  employeeId?: number;
  role: 'admin' | 'hr' | 'employee' | 'manager';
  status: 'active' | 'inactive';
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public profileImage!: string;
  public googleId!: string;
  public employeeId!: number;
  public role!: 'admin' | 'hr' | 'employee' | 'manager';
  public status!: 'active' | 'inactive';
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
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
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
      unique: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'hr', 'employee', 'manager'),
      defaultValue: 'employee',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize: db,
    modelName: 'User',
    tableName: 'users',
  },
);

User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasOne(User, { foreignKey: 'employeeId', as: 'user' });
