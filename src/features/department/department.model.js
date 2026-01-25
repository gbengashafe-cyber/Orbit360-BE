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
exports.Department = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var company_model_1 = require('../company/company.model');
var Department = /** @class */ (function (_super) {
  __extends(Department, _super);
  function Department() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return Department;
})(sequelize_1.Model);
exports.Department = Department;
Department.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: sequelize_1.DataTypes.STRING(100),
      allowNull: false,
      unique: 'name',
      set: function (value) {
        this.setDataValue('name', value.toUpperCase());
      },
    },
    description: {
      type: sequelize_1.DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db_1.db,
    underscored: true,
    tableName: 'departments',
    modelName: 'department',
  },
);
Department.belongsTo(company_model_1.Company, { foreignKey: { name: 'companyId', allowNull: false }, as: 'company' });
company_model_1.Company.hasMany(Department, { foreignKey: { name: 'companyId', allowNull: false }, as: 'company' });
