import { ContextMessageUpdate, Middleware } from 'telegraf';
import logger from '../util/logger';

export const unknownCallback = (): Middleware<ContextMessageUpdate> => (
  ctx: ContextMessageUpdate,
  next: Function,
): void => {
  if (ctx.callbackQuery && ctx.callbackQuery.data) {
    logger.debug('another callbackQuery happened', ctx, ctx.callbackQuery.data);
  }

  return next && next(ctx);
};
