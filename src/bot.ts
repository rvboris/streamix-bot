import getConnection from './util/getConnection';
import path from 'path';
import { botHandler, catchHandler, channelHandler } from './handlers';
import { config } from 'dotenv-safe';
import { dbConnection, i18n, unknownCallback, userInfo } from './middlewares';
import { ExtendedTelegrafContext } from './types/extended-telegraf-context';
import { mainMenu } from './menus';
import { MenuMiddleware } from 'telegraf-inline-menu';
import { Telegraf } from 'telegraf';
import { UpdateWorker } from './worker/UpdateWorker';

config();

getConnection().then((connection): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  const bot = new Telegraf<ExtendedTelegrafContext>(process.env.TELEGRAM_TOKEN, {
    telegram: {
      webhookReply: !isProduction,
    },
  });

  const worker = new UpdateWorker(connection);
  const defaultLanguage = 'en';
  const menuMiddleware = new MenuMiddleware('/', mainMenu());

  bot.use(i18n({ directory: path.resolve(__dirname, 'locales'), defaultLanguage }));
  bot.use(dbConnection({ connection }));
  bot.use(userInfo({ defaultLanguage }));
  bot.on('text', channelHandler(), botHandler());
  bot.command('start', (ctx) => ctx.reply('123'));
  bot.use(menuMiddleware);
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
