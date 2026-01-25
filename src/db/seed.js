'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
var _1 = require('.');
var company_model_1 = require('../features/company/company.model');
var department_model_1 = require('../features/department/department.model');
var employee_model_1 = require('../features/employee/employee.model');
var job_role_model_1 = require('../features/job-role/job-role.model');
var leave_model_1 = require('../features/leave/leave.model');
var payroll_model_1 = require('../features/payroll/payroll.model');
var logger_1 = require('../utils/logger');
function seed() {
  return __awaiter(this, void 0, void 0, function () {
    var companies, departments, jobRoles, employees, empList, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 8, , 9]);
          return [4 /*yield*/, _1.db.sync({ alter: true })];
        case 1:
          _a.sent();
          logger_1.logger.info('Database synced');
          return [
            4 /*yield*/,
            company_model_1.Company.bulkCreate([{ name: 'MFB', description: 'Microfinance Bank', createdBy: '' }], {
              ignoreDuplicates: true,
            }),
          ];
        case 2:
          companies = _a.sent();
          return [
            4 /*yield*/,
            department_model_1.Department.bulkCreate(
              [
                { name: 'Engineering', description: 'Software Development', companyId: companies[0].id },
                { name: 'HR', description: 'HR Department', companyId: companies[0].id },
                { name: 'Finance', description: 'Finance Department', companyId: companies[0].id },
                { name: 'Sales', description: 'Sales Department', companyId: companies[0].id },
              ],
              { ignoreDuplicates: true },
            ),
          ];
        case 3:
          departments = _a.sent();
          logger_1.logger.info('Departments created');
          return [
            4 /*yield*/,
            job_role_model_1.JobRole.bulkCreate(
              [
                { title: 'SENIOR_DEVELOPER', description: 'Senior Software Developer' },
                { title: 'JUNIOR_DEVELOPER', description: 'Junior Software Developer' },
                { title: 'HR_MANAGER', description: 'HR Manager' },
                { title: 'SALES_MANAGER', description: 'Sales Manager' },
                { title: 'HUMAN_RESOURCES_MANAGER', description: 'Human Resources Manager' },
                { title: 'HR_OPERATIONS', description: 'HR Operations Manager' },
              ],
              { ignoreDuplicates: true },
            ),
          ];
        case 4:
          jobRoles = _a.sent();
          logger_1.logger.info('Positions created');
          return [
            4 /*yield*/,
            employee_model_1.Employee.bulkCreate([
              {
                employeeId: '1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                hireDate: new Date('2023-01-15'),
                departmentName: departments[0].name,
                jobRole: jobRoles[0].title,
                status: 'active',
                dob: new Date('1990-05-15'),
                address: '123 Main St, Cityville',
                nationality: '',
                gender: 'M',
                supervisorId: '',
                annualBasicSalary: 200000,
                annualHousingAllowance: 200000,
                annualLeaveAllowance: 200000,
                annualTransportAllowance: 200000,
                annualOtherAllowances: 200000,
                bankName: 'MFB',
                bankCode: '20001',
                accountNumber: '200023123',
                accountName: 'John Doe',
                beneficiaryName: 'Smith Doe',
                beneficiaryRelationship: 'son',
                beneficiaryPhone: '',
                nokName: 'Smith Doe',
                nokRelationship: 'son',
                nokAddress: 'Same as employee',
                nokPhone: '',
                leaveEntitlement: 22,
                nhfApplicable: false,
              },
              {
                employeeId: '2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                phone: '+1234567891',
                hireDate: new Date('2023-03-20'),
                departmentName: departments[0].name,
                jobRole: jobRoles[1].title,
                status: 'active',
                dob: new Date('1992-08-25'),
                address: '456 Elm St, Townsville',
                nationality: '',
                gender: 'M',
                supervisorId: '',
                annualBasicSalary: 200000,
                annualHousingAllowance: 200000,
                annualLeaveAllowance: 200000,
                annualTransportAllowance: 200000,
                annualOtherAllowances: 200000,
                bankName: 'MFB',
                bankCode: '20001',
                accountNumber: '200023124',
                accountName: 'Jane Smith',
                beneficiaryName: 'Alice Smith',
                beneficiaryRelationship: 'daughter',
                beneficiaryPhone: '',
                nokName: 'Alice Smith',
                nokRelationship: 'daughter',
                nokAddress: 'Same as employee',
                nokPhone: '',
                leaveEntitlement: 22,
                nhfApplicable: false,
              },
              {
                employeeId: '3',
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'bob.johnson@example.com',
                phone: '+1234567892',
                hireDate: new Date('2022-06-10'),
                departmentName: departments[1].name,
                jobRole: jobRoles[2].title,
                status: 'active',
                dob: new Date('1988-11-12'),
                address: '789 Oak St, Villagetown',
                nationality: '',
                gender: 'M',
                supervisorId: '',
                annualBasicSalary: 200000,
                annualHousingAllowance: 200000,
                annualLeaveAllowance: 200000,
                annualTransportAllowance: 200000,
                annualOtherAllowances: 200000,
                bankName: 'MFB',
                bankCode: '20001',
                accountNumber: '200023125',
                accountName: 'Bob Johnson',
                beneficiaryName: 'Charlie Johnson',
                beneficiaryRelationship: 'brother',
                beneficiaryPhone: '',
                nokName: 'Charlie Johnson',
                nokRelationship: 'brother',
                nokAddress: 'Same as employee',
                nokPhone: '',
                leaveEntitlement: 22,
                nhfApplicable: false,
              },
            ]),
          ];
        case 5:
          employees = _a.sent();
          logger_1.logger.info('Employees created');
          empList = existingEmployees.length > 0 ? existingEmployees : employees;
          // Create Leave Requests
          return [
            4 /*yield*/,
            leave_model_1.Leave.bulkCreate(
              [
                {
                  employeeId: empList[0].id,
                  startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                  endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
                  type: 'vacation',
                  status: 'pending',
                  reason: 'Family vacation',
                },
              ],
              { ignoreDuplicates: true },
            ),
          ];
        case 6:
          // Create Leave Requests
          _a.sent();
          logger_1.logger.info('Leave requests created');
          // Create Payroll Records
          return [
            4 /*yield*/,
            payroll_model_1.Payroll.bulkCreate(
              [
                {
                  employeeId: empList[0].id,
                  payPeriod: '2026-01',
                  basicSalary: 75000,
                  grossSalary: 80000,
                  housingAllowance: 5000,
                  transportAllowance: 3000,
                  leaveAllowance: 2000,
                  otherAllowance: 1000,
                  pensionDeduction: 0,
                  nhfDeduction: 0,
                  loanDeduction: 0,
                  payeDeduction: 3000,
                  status: 'processed',
                },
                {
                  employeeId: empList[1].id,
                  payPeriod: '2026-01',
                  basicSalary: 65000,
                  grossSalary: 70000,
                  housingAllowance: 4000,
                  transportAllowance: 2500,
                  leaveAllowance: 1500,
                  otherAllowance: 800,
                  pensionDeduction: 0,
                  nhfDeduction: 0,
                  loanDeduction: 0,
                  payeDeduction: 2500,
                  status: 'paid',
                },
              ],
              { ignoreDuplicates: true },
            ),
          ];
        case 7:
          // Create Payroll Records
          _a.sent();
          logger_1.logger.info('Payroll records created');
          logger_1.logger.info('Database seeding completed successfully');
          process.exit(0);
          return [3 /*break*/, 9];
        case 8:
          error_1 = _a.sent();
          logger_1.logger.error('Error seeding database:', error_1);
          process.exit(1);
          return [3 /*break*/, 9];
        case 9:
          return [2 /*return*/];
      }
    });
  });
}
seed();
