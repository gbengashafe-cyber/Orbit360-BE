import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { Position } from '../position/position.model';
import { EmployeeCompensation } from './employeeCompensation.model';

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  declare employeeId: string;
  public firstName!: string;
  public lastName!: string;
  declare dob: Date;
  public email!: string;
  public phone!: string;
  declare address: string;
  public hireDate!: Date;
  declare terminationDate: CreationOptional<Date>;
  declare nationality: string;
  public salary!: number;
  declare gender: 'M' | 'F';
  declare supervisorId: ForeignKey<Employee['employeeId']>;
  declare department: ForeignKey<Department['name']>;
  declare position: ForeignKey<Position['title']>;
  declare status: 'active' | 'inactive' | 'terminated' | 'on_leave';
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      set(value: string) {
        this.setDataValue('lastName', value?.toUpperCase());
      },
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'email',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(100),
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    terminationDate: {
      type: DataTypes.DATE,
    },
    nationality: { type: DataTypes.STRING(30) },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave'),
      defaultValue: 'active',
    },
    gender: {
      type: DataTypes.ENUM('M', 'F'),
    },
  },
  {
    sequelize: db,
    tableName: 'employees',
    paranoid: true,
    underscored: true,
  },
);

Employee.belongsTo(Department, { foreignKey: { name: 'department', allowNull: false }, targetKey: 'name' });
Department.hasMany(Employee, { foreignKey: { name: 'department', allowNull: false }, sourceKey: 'name' });

Employee.hasOne(EmployeeCompensation, { foreignKey: { name: 'employeeId', allowNull: false }, as: 'employeeBank' });
EmployeeCompensation.belongsTo(Employee, { foreignKey: { name: 'employeeId', allowNull: false }, as: 'employeeBank' });

Position.hasMany(Employee, { foreignKey: 'positionId', as: 'employees' });
Employee.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });
