import { config } from 'dotenv-safe';

config();

import path from 'path';
import Telegraf from 'telegraf';
import getConnection from './util/getConnection';
import { Worker } from './worker/Worker';
import { userInfo, dbConnection, navigation, i18n, unknownCallback } from './middlewares';
import { catchHandler, channelHandler, botHandler } from './handlers';

getConnection().then(
  (connection): void => {
    const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
    const worker = new Worker(connection);
    const defaultLanguage = 'en';

    bot.use(i18n({ directory: path.resolve(__dirname, 'locales'), defaultLanguage }));
    bot.use(dbConnection({ connection }));
    bot.use(userInfo({ defaultLanguage }));
    bot.on('text', channelHandler(), botHandler());
    bot.use(navigation());
    bot.use(unknownCallback());
    bot.catch(catchHandler());
    bot.launch();
    worker.start();
  },
);
