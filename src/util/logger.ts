import { ContextMessageUpdate } from 'telegraf';
import util from 'util';
import winston, { format, Logger } from 'winston';

const { combine, timestamp, printf } = format;

const prepareMessage = (msg: string, ctx?: ContextMessageUpdate, ...data: any[]): string => {
  const formattedMessage = data.length ? util.format(msg, ...data) : msg;

  if (ctx && ctx.from) {
    return `[${ctx.from.id}/${ctx.from.username}]: ${formattedMessage}`;
  }

  return `: ${formattedMessage}`;
};

const logFormat = printf(
  (info): string => {
    return `[${info.timestamp}] [${info.level}] ${info.message}`;
  },
);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    }),
    new winston.transports.File({ filename: 'debug.log', level: 'debug' }),
  ],
  format: combine(timestamp(), format.splat(), format.simple(), logFormat),
});

if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized at debug level');
}

const loggerWithCtx = {
  debug: (msg: string, ctx?: ContextMessageUpdate, ...data: any[]): Logger =>
    logger.debug(prepareMessage(msg, ctx, ...data)),
  error: (msg: string, ctx?: ContextMessageUpdate, ...data: any[]): Logger =>
    logger.error(prepareMessage(msg, ctx, ...data)),
};

export default loggerWithCtx;
