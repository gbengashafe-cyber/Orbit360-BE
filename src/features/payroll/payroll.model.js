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
exports.Payroll = exports.payrollStatus = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var employee_model_1 = require('../employee/employee.model');
exports.payrollStatus = ['generated', 'processed', 'paid', 'failed', 'cancelled'];
var Payroll = /** @class */ (function (_super) {
  __extends(Payroll, _super);
  function Payroll() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return Payroll;
})(sequelize_1.Model);
exports.Payroll = Payroll;
Payroll.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payPeriod: { type: sequelize_1.DataTypes.STRING(7), allowNull: false, unique: 'employee_payPeriod' },
    employeeId: {
      type: sequelize_1.DataTypes.INTEGER,
      references: { model: employee_model_1.Employee, key: 'id' },
      allowNull: false,
      unique: 'employee_payPeriod',
    },
    grossSalary: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    basicSalary: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    housingAllowance: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    transportAllowance: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    leaveAllowance: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    otherAllowance: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pensionDeduction: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    nhfDeduction: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    loanDeduction: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payeDeduction: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: sequelize_1.DataTypes.ENUM,
      values: exports.payrollStatus,
      defaultValue: 'generated',
    },
    paymentDate: {
      type: sequelize_1.DataTypes.DATEONLY,
    },
    // VIRTUAL FIELDS
    totalDeductions: {
      type: sequelize_1.DataTypes.VIRTUAL,
      get: function () {
        return (
          (Number(this.pensionDeduction) || 0) +
          (Number(this.payeDeduction) || 0) +
          (Number(this.nhfDeduction) || 0) +
          (Number(this.loanDeduction) || 0)
        );
      },
    },
    totalAllowances: {
      type: sequelize_1.DataTypes.VIRTUAL,
      get: function () {
        return (
          (Number(this.housingAllowance) || 0) +
          (Number(this.transportAllowance) || 0) +
          (Number(this.leaveAllowance) || 0) +
          (Number(this.otherAllowance) || 0)
        );
      },
    },
    netSalary: {
      type: sequelize_1.DataTypes.VIRTUAL,
      get: function () {
        return (Number(this.grossSalary) || 0) - Number(this.totalDeductions);
      },
    },
  },
  {
    sequelize: db_1.db,
    tableName: 'payrolls',
  },
);
Payroll.belongsTo(employee_model_1.Employee, { foreignKey: 'employeeId', as: 'employee' });
employee_model_1.Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls' });
