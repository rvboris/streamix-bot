import logger from '../util/logger';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { Middleware } from 'telegraf';

export const unknownCallback = (): Middleware<ExtendedTelegrafContext> => (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): void => {
  if (ctx.callbackQuery && ctx.callbackQuery.data) {
    logger.debug('another callbackQuery happened', { ctx });
  }

  return next && next();
};
