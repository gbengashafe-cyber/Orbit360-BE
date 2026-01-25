'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.db = void 0;
var sequelize_1 = require('sequelize');
var env_1 = require('../config/env');
var logger_1 = require('../utils/logger');
var DB_NAME = env_1.env.DB_NAME,
  DB_USER = env_1.env.DB_USER,
  DB_PASSWORD = env_1.env.DB_PASSWORD,
  DB_HOST_NAME = env_1.env.DB_HOST_NAME,
  DB_TYPE = env_1.env.DB_TYPE,
  DB_PORT = env_1.env.DB_PORT;
var db = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST_NAME,
  port: DB_PORT,
  dialect: DB_TYPE,
  pool: {
    max: 5,
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  },
  dialectOptions: {
    decimalNumbers: true,
  },
  logging: function (msg) {
    return env_1.env.NODE_ENV === 'production' ? logger_1.logger.debug(msg) : logger_1.logger.info(msg);
  },
});
exports.db = db;
db.authenticate()
  .then(function () {})
  .catch(function (error) {
    logger_1.logger.error('Test DB connection failed. Error: '.concat(error.name, ' - ').concat(error.message));
    logger_1.logger.debug(
      'Test DB connection failed. Host: '
        .concat(db.config.host, ', Port: ')
        .concat(db.config.port, ', DatabaseName: ')
        .concat(db.config.database),
    );
  });
