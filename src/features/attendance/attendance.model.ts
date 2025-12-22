import { DataTypes, Model } from 'sequelize';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';

export interface AttendanceAttributes {
  id?: number;
  employeeId: number;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late';
}

export class Attendance extends Model<AttendanceAttributes> implements AttendanceAttributes {
  public id!: number;
  public employeeId!: number;
  public date!: Date;
  public checkIn!: Date;
  public checkOut!: Date;
  public status!: 'present' | 'absent' | 'late';
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late'),
      defaultValue: 'present',
    },
  },
  {
    sequelize: db,
    modelName: 'Attendance',
    tableName: 'attendances',
  },
);

Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
