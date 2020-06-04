import { Middleware } from 'telegraf';
import { Connection } from 'typeorm';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';

export const dbConnection = ({ connection }: { connection: Connection }): Middleware<ExtendedTelegrafContext> => (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): void => {
  ctx.connection = connection;

  return next && next();
};
