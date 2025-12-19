import { db } from '../db';
import { Department } from '../features/department/department.model';
import { Employee } from '../features/employee/employee.model';
import { Attendance } from './attendance.model';
import { Leave } from './leave.model';
import { Payroll } from './payroll.model';
import { Position } from './position.model';
import { User } from './user.model';

// Define associations
Position.hasMany(Employee, { foreignKey: 'positionId', as: 'employees' });
Employee.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });

Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasOne(User, { foreignKey: 'employeeId', as: 'user' });

export { Attendance, db, Department, Employee, Leave, Payroll, Position, User };
