'use strict';
var _a;
Object.defineProperty(exports, '__esModule', { value: true });
exports.logger = void 0;
require('dotenv/config');
var winston_1 = require('winston');
var transports = winston_1.default.transports,
  format = winston_1.default.format;
var timestamp = format.timestamp,
  combine = format.combine,
  errors = format.errors,
  printf = format.printf;
var errorTransport = new transports.File({
  filename: 'logs/'.concat(new Date().toJSON().slice(0, 10), '/error.log'),
  level: 'error',
});
var infoLevelOnly = winston_1.default.format(function (log) {
  return log.level === 'info' ? log : false;
});
var httpLevelOnly = winston_1.default.format(function (log) {
  return log.level === 'http' ? log : false;
});
var infoTransport = new transports.File({
  filename: 'logs/'.concat(new Date().toJSON().slice(0, 10), '/info.log'),
  level: 'info',
  format: infoLevelOnly(),
});
var accessTransport = new transports.File({
  filename: 'logs/'.concat(new Date().toJSON().slice(0, 10), '/access.log'),
  level: 'http',
  format: httpLevelOnly(),
});
var logger = winston_1.default.createLogger({
  level: ((_a = process.env.LOG_LEVEL) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS A' }), printf(jsonPrintFormat)),
  transports: [errorTransport, infoTransport, accessTransport],
});
exports.logger = logger;
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston_1.default.transports.Console());
}
function jsonPrintFormat(log) {
  if (log.level === 'http') {
    return log.message;
  }
  var output = Object.assign({}, { timestamp: log.timestamp, level: log.level, message: log.message });
  function appendLogKeyValue(prop, logMessageObject) {
    var _a;
    if (log[prop]) {
      logMessageObject = Object.assign({}, logMessageObject, ((_a = {}), (_a[prop] = log[prop]), _a));
    }
    return logMessageObject;
  }
  var logStandardProps = ['requestId', 'ip', 'code', 'name', 'path', 'method', 'origin', 'referer', 'stack'];
  // Useful for tracking non-standard log props
  var logCopy = {};
  var logHasNonStandardProps = Object.keys(log).length > logStandardProps.length;
  if (logHasNonStandardProps) {
    logCopy = Object.assign({}, log);
  }
  logStandardProps.forEach(function (prop) {
    if (log[prop]) {
      output = appendLogKeyValue(prop, output);
    }
    if (logHasNonStandardProps && logCopy[prop]) {
      delete logCopy[prop];
    }
  });
  if (logHasNonStandardProps) {
    Object.keys(logCopy).forEach(function (prop) {
      output = appendLogKeyValue(prop, output);
    });
  }
  return JSON.stringify(output);
}
