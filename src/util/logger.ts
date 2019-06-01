import util from 'util';
import winston, { format } from 'winston';

const { combine, timestamp, printf } = format;

const logContext = format(
  (info): any => {
    const ctx = info.ctx;

    const formattedMessage = (info.message = info.meta ? util.format(info.message, ...info.meta) : info.message);

    if (info.isWorker) {
      info.message = `[worker] ${formattedMessage}`;
    }

    if (ctx && ctx.from) {
      info.message = `[${ctx.from.id}/${ctx.from.username}] ${formattedMessage}`;
    }

    return info;
  },
);

const logFormat = printf(
  (info): string => {
    return `[${info.timestamp}] [${info.level}] ${info.message}`;
  },
);

const currentLevel = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

const logger = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      level: currentLevel,
      handleExceptions: true,
    }),
  ],
  format: combine(timestamp(), format.splat(), format.simple(), logContext(), logFormat),
});

if (process.env.NODE_ENV !== 'production') {
  logger.debug(`logging initialized at ${currentLevel} level`);
}

export default logger;
