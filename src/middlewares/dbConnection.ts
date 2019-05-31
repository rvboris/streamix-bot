import { ContextMessageUpdate, Middleware } from 'telegraf';
import { Connection } from 'typeorm';

export const dbConnection = ({ connection }: { connection: Connection }): Middleware<ContextMessageUpdate> => (
  ctx: ContextMessageUpdate,
  next: Function,
): void => {
  ctx.connection = connection;

  return next && next(ctx);
};
