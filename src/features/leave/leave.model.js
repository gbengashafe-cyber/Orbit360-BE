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
exports.Leave = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var employee_model_1 = require('../employee/employee.model');
var Leave = /** @class */ (function (_super) {
  __extends(Leave, _super);
  function Leave() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return Leave;
})(sequelize_1.Model);
exports.Leave = Leave;
Leave.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: sequelize_1.DataTypes.INTEGER,
      allowNull: false,
    },
    startDate: {
      type: sequelize_1.DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: sequelize_1.DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: sequelize_1.DataTypes.ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity'),
      allowNull: false,
    },
    status: {
      type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    reason: {
      type: sequelize_1.DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db_1.db,
    modelName: 'Leave',
    tableName: 'leaves',
  },
);
Leave.belongsTo(employee_model_1.Employee, { foreignKey: 'employeeId', as: 'employee' });
employee_model_1.Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
