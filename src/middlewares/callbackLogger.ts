import { logger } from '../util/logger';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { Middleware } from 'telegraf';

export const callbackLogger = (): Middleware<ExtendedTelegrafContext> => (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): void => {
  if (ctx.callbackQuery && ctx.user.isAdmin) {
    logger.info(`callback data just happened ${ctx.callbackQuery.data}`);
  }

  return next();
};
