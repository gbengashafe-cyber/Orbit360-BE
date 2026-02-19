import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributes,
} from 'sequelize';
import { db } from '../../db';
import { Department } from '../department/department.model';
import { JobRole } from '../job-role/job-role.model';
import { User } from '../users/user.model';
import { EmployeeChangeRequest } from './employee-change-request.model';
import { EmployeeFields, employeeStatus } from './employee-schema';
import { Employee } from './employee.model';

export class EmployeeDraft extends Model<InferAttributes<EmployeeDraft>, InferCreationAttributes<EmployeeDraft>> {
  declare id: CreationOptional<number>;
  declare requestId: ForeignKey<number>;
  declare previousStatus: (typeof employeeStatus)[number];

  // Personal Information
  declare staffId: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare dob: Date;
  declare gender: 'M' | 'F';
  declare nationality: string;
  declare address: string;
  // Employment details
  declare companyId: number;
  declare departmentId: ForeignKey<Department['id']>;
  declare jobRoleId: ForeignKey<JobRole['id']>;
  declare hireDate: Date;
  declare status: (typeof employeeStatus)[number];
  declare terminationDate: CreationOptional<Date>;
  // Reporting Line
  declare supervisorId: CreationOptional<ForeignKey<Employee['id']>>;
  // Compensation and benefit
  declare annualBasicSalary: number;
  declare annualHousingAllowance: number;
  declare annualTransportAllowance: number;
  declare annualLeaveAllowance: number;
  declare annualOtherAllowances: number;
  // Bank Information
  declare bankName: string;
  declare bankCode: string;
  declare accountNumber: string;
  declare accountName: string;
  // Emergency Contact and NOK
  declare beneficiaryName: string;
  declare beneficiaryRelationship: string;
  declare beneficiaryPhone: string;
  declare nokName: string;
  declare nokRelationship: string;
  declare nokPhone: string;
  declare nokAddress: string;
  // Leave Entitlement
  declare leaveEntitlement: number;
  // Others
  declare nhfApplicable: boolean;
  declare annualRentAmount: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EmployeeDraft.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employee_change_requests', key: 'id' },
      onDelete: 'CASCADE',
    },
    previousStatus: { type: DataTypes.STRING(20), allowNull: false },
    ...EmployeeFields,
  } as unknown as ModelAttributes<EmployeeDraft, InferAttributes<EmployeeDraft>>,
  {
    sequelize: db,
    tableName: 'employee_drafts',
    timestamps: true,
  },
);

EmployeeDraft.belongsTo(Employee, { foreignKey: 'supervisorId', as: 'draftSupervisor' });

EmployeeDraft.belongsTo(EmployeeChangeRequest, { foreignKey: 'requestId', as: 'request' });
EmployeeChangeRequest.hasOne(EmployeeDraft, { foreignKey: 'requestId', as: 'employeeDraft' });

EmployeeChangeRequest.belongsTo(Employee, { foreignKey: 'employeeId' });
Employee.hasMany(EmployeeChangeRequest, { foreignKey: 'employeeId', as: 'changeRequests' });

EmployeeChangeRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'initiator' });
User.hasMany(EmployeeChangeRequest, { foreignKey: 'requestedBy', as: 'initiatedRequests' });

EmployeeChangeRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(EmployeeChangeRequest, { foreignKey: 'reviewedBy', as: 'reviewedRequests' });
