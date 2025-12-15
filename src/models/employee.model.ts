import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export interface EmployeeAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: Date;
  salary: number;
  departmentId: number;
  positionId: number;
  status: 'active' | 'inactive';
}

export class Employee extends Model<EmployeeAttributes> implements EmployeeAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  public hireDate!: Date;
  public salary!: number;
  public departmentId!: number;
  public positionId!: number;
  public status!: 'active' | 'inactive';
}

Employee.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  hireDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  sequelize: db,
  modelName: 'Employee',
  tableName: 'employees',
});