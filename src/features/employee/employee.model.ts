import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { Position } from '../../models/position.model';
import { Department } from '../department/department.model';

export class Employee extends Model<InferAttributes<Employee>, InferCreationAttributes<Employee>> {
  declare id: CreationOptional<number>;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  public hireDate!: Date;
  public salary!: number;
  declare departmentId: ForeignKey<Department['id']>;
  declare positionId: ForeignKey<Position['id']>;
  public status!: 'active' | 'inactive';
}

Employee.init(
  {
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
      set(value: string) {
        this.setDataValue('lastName', value?.toUpperCase());
      },
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

    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize: db,
    tableName: 'employees',
    paranoid: true,
  },
);

Employee.belongsTo(Department, { foreignKey: { name: 'departmentId', allowNull: false }, as: 'department' });
Department.hasMany(Employee, { foreignKey: { name: 'departmentId', allowNull: false }, as: 'employees' });
