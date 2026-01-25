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
exports.JobApplication = void 0;
var sequelize_1 = require('sequelize');
var db_1 = require('../../db');
var JobApplication = /** @class */ (function (_super) {
  __extends(JobApplication, _super);
  function JobApplication() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  return JobApplication;
})(sequelize_1.Model);
exports.JobApplication = JobApplication;
JobApplication.init(
  {
    id: {
      type: sequelize_1.DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    job_posting_id: {
      type: sequelize_1.DataTypes.INTEGER,
      allowNull: false,
    },
    applicant_name: {
      type: sequelize_1.DataTypes.STRING(255),
      allowNull: false,
    },
    applicant_email: {
      type: sequelize_1.DataTypes.STRING(255),
      allowNull: false,
    },
    applicant_phone: {
      type: sequelize_1.DataTypes.STRING(20),
      allowNull: false,
    },
    applicant_id: {
      type: sequelize_1.DataTypes.STRING(20),
      allowNull: false,
    },
    salary_expectation: {
      type: sequelize_1.DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    resume_url: {
      type: sequelize_1.DataTypes.STRING(500),
      allowNull: true,
    },
    cover_letter: {
      type: sequelize_1.DataTypes.TEXT,
      allowNull: true,
    },
    applied_date: {
      type: sequelize_1.DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize_1.DataTypes.NOW,
    },
    status: {
      type: sequelize_1.DataTypes.ENUM(
        'applied',
        'under_review',
        'interview_scheduled',
        'interviewed',
        'offered',
        'hired',
        'rejected',
      ),
      defaultValue: 'applied',
    },
    interview_date: {
      type: sequelize_1.DataTypes.DATE,
      allowNull: true,
    },
    interview_notes: {
      type: sequelize_1.DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: sequelize_1.DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 },
    },
  },
  {
    sequelize: db_1.db,
    modelName: 'JobApplication',
    tableName: 'job_applications',
  },
);
