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
  declare gender: 'M' | 'F';
  declare supervisorId: ForeignKey<Employee['employeeId']>;
  declare departmentName: ForeignKey<Department['name']>;
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
      unique: 'employeeId',
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
    supervisorId: { type: DataTypes.STRING(10), references: { model: Employee, key: 'employee_id' }, allowNull: true },
    nationality: { type: DataTypes.STRING(30) },
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

Employee.belongsTo(Department, {
  foreignKey: { name: 'departmentName', allowNull: false },
  as: 'department',
  targetKey: 'name',
});
Department.hasMany(Employee, {
  foreignKey: { name: 'departmentName', allowNull: false },
  as: 'department',
  sourceKey: 'name',
});

EmployeeCompensation.belongsTo(Employee, {
  foreignKey: { name: 'employeeId', allowNull: false },
  as: 'compensation',
  targetKey: 'employeeId',
});
Employee.hasOne(EmployeeCompensation, {
  foreignKey: { name: 'employeeId', allowNull: false },
  as: 'compensation',
  sourceKey: 'employeeId',
});

Position.hasMany(Employee, { foreignKey: { name: 'position', allowNull: false }, sourceKey: 'title' });
Employee.belongsTo(Position, { foreignKey: { name: 'position', allowNull: false }, targetKey: 'title' });
