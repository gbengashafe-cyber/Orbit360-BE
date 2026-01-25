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
exports.JobRole = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var JobRole = /** @class */ (function (_super) {
  __extends(JobRole, _super);
  function JobRole() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return JobRole;
})(sequelize_1.Model);
exports.JobRole = JobRole;
JobRole.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: sequelize_1.DataTypes.STRING(100),
      allowNull: false,
      unique: 'title',
      set: function (value) {
        this.setDataValue('title', value.toUpperCase());
      },
    },
    description: {
      type: sequelize_1.DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db_1.db,
    tableName: 'job_roles',
  },
);
