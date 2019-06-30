import Telegram from 'telegraf/telegram';
import logger from '../util/logger';
import { Bot, Settings, Channel } from '../entites';
import { Middleware, ContextMessageUpdate } from 'telegraf';
import { get } from 'lodash';
import { filterAsync } from '../util/filterAsync';

const BOT_FATHER_ID = '93372553';
const BOT_REGEXP = /\d+:.{35}/;

export const botHandler = (): Middleware<ContextMessageUpdate> => async (ctx, next): Promise<void> => {
  try {
    if (get(ctx, 'message.forward_from.id', '').toString() !== BOT_FATHER_ID) {
      return next && next();
    }

    if (!get(ctx, 'message.forward_from.is_bot', false)) {
      return next && next();
    }

    const [botToken = ''] = get(ctx, 'message.text', '').match(BOT_REGEXP) || [];

    if (!botToken) {
      return next && next();
    }

    const userBot = new Telegram(botToken);
    const botInfo = await userBot.getMe();
    const isBotExists = await ctx.connection.manager.count(Bot, { token: botToken });

    if (isBotExists) {
      return next && next();
    }

    await ctx.connection.manager.transaction(
      async (transactionalEntityManager): Promise<void> => {
        const channels = await transactionalEntityManager.find(Channel, { user: ctx.user });
        const botAdminChannels = await filterAsync<Channel>(channels, async (channel): Promise<boolean> => {
          const chatMembers = await userBot.getChatAdministrators(channel.telegramId);
          const adminBot = chatMembers.find(
            ({ user }): boolean => {
              return user.is_bot && user.id === botInfo.id;
            },
          );

          return !!adminBot;
        });

        const newBot = new Bot();

        newBot.telegramId = botInfo.id;
        newBot.token = botToken;
        newBot.username = botInfo.username;
        newBot.user = ctx.user;

        if (botAdminChannels.length) {
          newBot.channels = botAdminChannels;
        }

        await transactionalEntityManager.save(newBot);
        await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultBot: newBot });
      },
    );

    await ctx.reply(ctx.i18n.t('menus.bots.addSuccessText', { botName: botInfo.username }));
  } catch (e) {
    await ctx.reply(ctx.i18n.t('menus.bots.addFailText'));
    logger.error(e.stack);
  }

  return next && next();
};
