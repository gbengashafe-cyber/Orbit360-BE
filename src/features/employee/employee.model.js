'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.Employee = exports.employeeStatus = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var department_model_1 = require('../department/department.model');
var job_role_model_1 = require('../job-role/job-role.model');
exports.employeeStatus = ['active', 'suspended', 'terminated', 'on_leave'];
var Employee = /** @class */ (function (_super) {
  __extends(Employee, _super);
  function Employee() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return Employee;
})(sequelize_1.Model);
exports.Employee = Employee;
Employee.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: sequelize_1.DataTypes.STRING(10),
      allowNull: false,
      unique: 'employeeId',
    },
    firstName: {
      type: sequelize_1.DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: sequelize_1.DataTypes.STRING(50),
      allowNull: false,
      set: function (value) {
        this.setDataValue('lastName', value === null || value === void 0 ? void 0 : value.toUpperCase());
      },
    },
    email: {
      type: sequelize_1.DataTypes.STRING(100),
      allowNull: false,
      unique: 'email',
    },
    phone: {
      type: sequelize_1.DataTypes.STRING(20),
      allowNull: false,
    },
    dob: {
      type: sequelize_1.DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: sequelize_1.DataTypes.ENUM('M', 'F'),
    },
    nationality: { type: sequelize_1.DataTypes.STRING(30) },
    address: {
      type: sequelize_1.DataTypes.STRING(100),
    },
    hireDate: {
      type: sequelize_1.DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: sequelize_1.DataTypes.ENUM,
      values: exports.employeeStatus,
      defaultValue: 'active',
    },
    terminationDate: {
      type: sequelize_1.DataTypes.DATE,
    },
    supervisorId: {
      type: sequelize_1.DataTypes.STRING(10),
      references: { model: Employee, key: 'employee_id' },
      allowNull: true,
    },
    annualBasicSalary: { type: sequelize_1.DataTypes.DECIMAL(17, 2), allowNull: false },
    annualHousingAllowance: { type: sequelize_1.DataTypes.DECIMAL(17, 2), allowNull: false },
    annualTransportAllowance: { type: sequelize_1.DataTypes.DECIMAL(17, 2), allowNull: false },
    annualLeaveAllowance: { type: sequelize_1.DataTypes.DECIMAL(17, 2), allowNull: false },
    annualOtherAllowances: { type: sequelize_1.DataTypes.DECIMAL(17, 2), allowNull: false },
    bankName: {
      type: sequelize_1.DataTypes.STRING(50),
      allowNull: false,
      set: function (value) {
        this.setDataValue('bankName', value.toUpperCase());
      },
    },
    bankCode: {
      type: sequelize_1.DataTypes.STRING(30),
      allowNull: false,
    },
    accountNumber: {
      type: sequelize_1.DataTypes.STRING(20),
      allowNull: false,
    },
    accountName: {
      type: sequelize_1.DataTypes.STRING(100),
      allowNull: false,
      set: function (value) {
        this.setDataValue('accountName', value.toUpperCase());
      },
    },
    beneficiaryName: { type: sequelize_1.DataTypes.STRING(100) },
    beneficiaryRelationship: { type: sequelize_1.DataTypes.STRING(50) },
    beneficiaryPhone: { type: sequelize_1.DataTypes.STRING(50) },
    nokName: { type: sequelize_1.DataTypes.STRING(100) },
    nokRelationship: { type: sequelize_1.DataTypes.STRING(50) },
    nokPhone: { type: sequelize_1.DataTypes.STRING(50) },
    nokAddress: { type: sequelize_1.DataTypes.STRING(100) },
    leaveEntitlement: { type: sequelize_1.DataTypes.INTEGER() },
    nhfApplicable: {
      type: sequelize_1.DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize: db_1.db,
    tableName: 'employees',
    underscored: true,
  },
);
Employee.belongsTo(department_model_1.Department, {
  foreignKey: { name: 'departmentName', allowNull: false },
  targetKey: 'name',
});
department_model_1.Department.hasMany(Employee, {
  foreignKey: { name: 'departmentName', allowNull: false },
  sourceKey: 'name',
});
Employee.belongsTo(job_role_model_1.JobRole, { foreignKey: { name: 'jobRole', allowNull: false }, targetKey: 'title' });
job_role_model_1.JobRole.hasMany(Employee, { foreignKey: { name: 'jobRole', allowNull: false }, sourceKey: 'title' });
