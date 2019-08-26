import { config } from 'dotenv-safe';

config();

import path from 'path';
import Telegraf from 'telegraf';
import getConnection from './util/getConnection';
import { UpdateWorker } from './worker/UpdateWorker';
import { userInfo, dbConnection, navigation, i18n, unknownCallback } from './middlewares';
import { catchHandler, channelHandler, botHandler } from './handlers';

getConnection().then((connection): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
    telegram: {
      webhookReply: !isProduction,
    },
  });

  const worker = new UpdateWorker(connection);
  const defaultLanguage = 'en';

  bot.use(i18n({ directory: path.resolve(__dirname, 'locales'), defaultLanguage }));
  bot.use(dbConnection({ connection }));
  bot.use(userInfo({ defaultLanguage }));
  bot.on('text', channelHandler(), botHandler());
  bot.use(navigation());
  bot.use(unknownCallback());
  bot.catch(catchHandler());

  const launchConfig = isProduction
    ? {
        webhook: {
          domain: process.env.WEBHOOK_DOMAIN,
          host: process.env.WEBHOOK_HOST,
          hookPath: process.env.WEBHOOK_PATH,
          port: parseInt(process.env.WEBHOOK_PORT, 10),
        },
      }
    : undefined;

  bot.launch(launchConfig as any);

  worker.start();
});
