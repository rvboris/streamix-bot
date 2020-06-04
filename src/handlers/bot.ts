import { logger } from '../utils/logger';
import { getTelegram } from '../utils/get-telegram';
import { Bot, Channel, Settings } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { filterAsync } from '../utils/filter-async';
import { get } from 'lodash';
import { Middleware } from 'telegraf';
import { mainMenuMiddleware } from '../menus';

const BOT_FATHER_ID = '93372553';
const BOT_REGEXP = /\d+:.{35}/;

export const botHandler = (): Middleware<ExtendedTelegrafContext> => async (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): Promise<void> => {
  try {
    if (get(ctx, 'message.forward_from.id', '').toString() !== BOT_FATHER_ID) {
      return next();
    }

    if (!get(ctx, 'message.forward_from.is_bot', false)) {
      return next();
    }

    const [botToken = ''] = get(ctx, 'message.text', '').match(BOT_REGEXP) || [];

    if (!botToken) {
      return next();
    }

    const userBot = getTelegram(botToken);
    const botInfo = await userBot.getMe();
    const isBotExists = await ctx.connection.manager.count(Bot, { token: botToken, user: ctx.user });

    if (isBotExists) {
      await ctx.reply(ctx.i18n.t('menus.bots.addFailAlreadyExistsText', { botName: botInfo.username }));
      return next();
    }

    await ctx.connection.manager.transaction(
      async (transactionalEntityManager): Promise<void> => {
        const channels = await transactionalEntityManager.find(Channel, { user: ctx.user });
        const botAdminChannels = await filterAsync<Channel>(
          channels,
          async (channel): Promise<boolean> => {
            const chatMembers = await userBot.getChatAdministrators(channel.telegramId);
            const adminBot = chatMembers.find(({ user }): boolean => {
              return user.is_bot && user.id === botInfo.id;
            });

            return !!adminBot;
          },
        );

        const newBot = new Bot();

        newBot.telegramId = `${botInfo.id}`;
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
    await mainMenuMiddleware.replyToContext(ctx, '/');
  } catch (e) {
    await ctx.reply(ctx.i18n.t('menus.bots.addFailText'));
    logger.error(e.stack, { ctx });
  }

  return next();
};
