import { db } from '../db';
import { Employee } from './employee.model';
import { Department } from './department.model';
import { Position } from './position.model';
import { Attendance } from './attendance.model';
import { Leave } from './leave.model';
import { Payroll } from './payroll.model';
import { User } from './user.model';
import { JobPosting } from './job-posting.model';
import { JobApplication } from './job-application.model';

// Define associations
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

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

JobPosting.hasMany(JobApplication, { foreignKey: 'job_posting_id', as: 'applications' });
JobApplication.belongsTo(JobPosting, { foreignKey: 'job_posting_id', as: 'jobPosting' });

export { db, Employee, Department, Position, Attendance, Leave, Payroll, User, JobPosting, JobApplication };
