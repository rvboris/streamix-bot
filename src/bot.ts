import path from 'path';
import { addRssQuestion, contactQuestion } from './questions';
import { botHandler, catchHandler, channelHandler } from './handlers';
import { config } from 'dotenv-safe';
import { dbConnection, i18n, unknownCallback, userInfo, callbackLogger } from './middlewares';
import { ExtendedTelegrafContext } from './types/extended-telegraf-context';
import { getConnection } from './utils/get-connection';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { mainMenuMiddleware } from './menus';
import { Telegraf } from 'telegraf';
import { UpdateWorker } from './worker/update-worker';
import { logger, getMenuPath } from './utils';
import { ActionCode } from './enums';

config({
  allowEmptyValues: true,
});

getConnection().then((connection): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  logger.info(Array(50).join('#'));
  logger.info(`start bot in ${process.env.NODE_ENV} mode`);
  logger.info(Array(50).join('#'));

  const bot = new Telegraf<ExtendedTelegrafContext>(process.env.TELEGRAM_TOKEN, {
    telegram: {
      agent: process.env.TELEGRAM_HTTPS_PROXY ? new HttpsProxyAgent(process.env.TELEGRAM_HTTPS_PROXY) : undefined,
      webhookReply: !isProduction,
    },
  });

  const worker = new UpdateWorker(connection);
  const defaultLanguage = 'en';

  bot.use(i18n({ directory: path.resolve(__dirname, 'locales'), defaultLanguage }));
  bot.use(dbConnection({ connection }));
  bot.use(userInfo({ defaultLanguage }));

  bot.on('text', channelHandler(), botHandler());

  bot.start((ctx) => mainMenuMiddleware.replyToContext(ctx));
  bot.help((ctx) => mainMenuMiddleware.replyToContext(ctx, getMenuPath(ActionCode.MAIN_HELP)));

  bot.command('settings', (ctx) => mainMenuMiddleware.replyToContext(ctx, getMenuPath(ActionCode.MAIN_SETTINGS)));
  bot.command('contact', (ctx) => contactQuestion.replyWithMarkdown(ctx, ctx.i18n.t('menus.main.contactQuestion')));

  bot.use(addRssQuestion.middleware());
  bot.use(contactQuestion.middleware());

  if (!isProduction) {
    bot.use(callbackLogger());
  }

  bot.use(mainMenuMiddleware);
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
