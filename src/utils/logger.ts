import 'dotenv/config';
import winston, { Logger as WinstonLogger } from 'winston';
import { TransformableInfo } from 'winston/lib/winston/logger';

const { transports, format } = winston;
const { timestamp, combine, errors, printf } = format;

const errorTransport = new transports.File({
  filename: `logs/${new Date().toJSON().slice(0, 10)}/error.log`,
  level: 'error',
});

const infoLevelOnly = winston.format((log) => {
  return log.level === 'info' ? log : false;
});

const httpLevelOnly = winston.format((log) => {
  return log.level === 'http' ? log : false;
});

const infoTransport = new transports.File({
  filename: `logs/${new Date().toJSON().slice(0, 10)}/info.log`,
  level: 'info',
  format: infoLevelOnly(),
});

const accessTransport = new transports.File({
  filename: `logs/${new Date().toJSON().slice(0, 10)}/access.log`,
  level: 'http',
  format: httpLevelOnly(),
});

const logger: WinstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL?.toLowerCase() || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS A' }),
    printf(jsonPrintFormat),
  ),
  transports: [errorTransport, infoTransport, accessTransport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

function jsonPrintFormat(log: TransformableInfo) {
  if (log.level === 'http') {
    return log.message;
  }

  let output: Record<string, any> = Object.assign(
    {},
    { timestamp: log.timestamp, level: log.level, message: log.message },
  );

  function appendLogKeyValue(prop: string, logMessageObject: Record<string, any>) {
    if (log[prop]) {
      logMessageObject = Object.assign({}, logMessageObject, {
        [prop]: log[prop],
      });
    }
    return logMessageObject;
  }

  const logStandardProps = [
    'requestId',
    'ip',
    'code',
    'name',
    'path',
    'method',
    'origin',
    'referer',
    'stack',
  ];

  // Useful for tracking non-standard log props
  let logCopy: Record<string, any> = {};

  const logHasNonStandardProps =
    Object.keys(log).length > logStandardProps.length;
  if (logHasNonStandardProps) {
    logCopy = Object.assign({}, log);
  }

  logStandardProps.forEach((prop) => {
    if (log[prop]) {
      output = appendLogKeyValue(prop, output);
    }
    if (logHasNonStandardProps && logCopy[prop]) {
      delete logCopy[prop];
    }
  });

  if (logHasNonStandardProps) {
    Object.keys(logCopy).forEach((prop) => {
      output = appendLogKeyValue(prop, output);
    });
  }

  return JSON.stringify(output);
}

export { logger };
