const winston = require('winston');
const path = require('path');

const consoleFormat = winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
  const msg = `${timestamp} [${level}]: ${stack || message}`;
  
  const meta = Object.keys(metadata).length ? `\nMetadata: ${JSON.stringify(metadata, null, 2)}` : '';
  
  return msg + meta;
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  }));
}

module.exports = logger;