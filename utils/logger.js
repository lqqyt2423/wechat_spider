'use strict';

const winston = require('winston');
const config = require('../config');
const isDev = config.isDev;

const loggerFormats = [
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(info => {
    let str = `${info.timestamp} ${info.level}: `;
    let msg = info.message;
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    str += msg;
    if (info.stack) str += info.stack;
    return str;
  }),
];
if (isDev) {
  loggerFormats.unshift(winston.format.colorize());
}
const logger = winston.createLogger({
  level: isDev ? 'silly' : 'http',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(...loggerFormats)
});

module.exports = logger;
