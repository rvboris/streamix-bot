import { Bot, Channel, Settings } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { filterAsync } from '../utils/filter-async';
import { get } from 'lodash';
import { getTelegram } from '../utils/get-telegram';
import { logger } from '../utils/logger';
import { mainMenuMiddleware } from '../menus';
import { Middleware } from 'telegraf';

export const channelHandler = (): Middleware<ExtendedTelegrafContext> => async (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): Promise<void> => {
  try {
    if (!get(ctx, 'message.forward_from_message_id', false)) {
      return next();
    }

    const { id: channelId, title: channelTitle, username: channelUsername } = get(ctx, 'message.forward_from_chat', {});

    if (!channelId || !channelTitle) {
      return next();
    }

    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });

    if (!userBots.length) {
      ctx.reply(ctx.i18n.t('menus.channel.addFailNoBotsText', { channelName: channelTitle }));
      return next();
    }

    const adminBots = await filterAsync<Bot>(
      userBots,
      async (bot): Promise<boolean> => {
        try {
          const chatMembers = await getTelegram(bot.token).getChatAdministrators(channelId);
          const adminBot = chatMembers.find(({ user }): boolean => {
            return user.is_bot && `${user.id}` === bot.telegramId;
          });

          return !!adminBot;
        } catch (e) {
          logger.error(e.stack, { ctx });
          return false;
        }
      },
    );

    if (!adminBots.length) {
      ctx.reply(ctx.i18n.t('menus.channel.addFailAdminBotText', { channelName: channelTitle }));
      return next();
    }

    const channel = await ctx.connection.manager.findOne(Channel, {
      telegramId: `${channelId}`,
    });

    if (channel) {
      ctx.reply(ctx.i18n.t('menus.channel.addFailAlreadyExistsText', { channelName: channelTitle }));
      return next();
    }

    await ctx.connection.manager.transaction(
      async (transactionalEntityManager): Promise<void> => {
        const newChannel = new Channel();

        newChannel.telegramId = `${channelId}`;

        if (channelUsername) {
          newChannel.username = channelUsername;
        }

        newChannel.title = channelTitle;
        newChannel.bots = adminBots;
        newChannel.user = ctx.user;

        await transactionalEntityManager.save(newChannel);
        await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultChannel: newChannel });
      },
    );

    ctx.reply(ctx.i18n.t('menus.channel.addSuccessText', { channelName: channelTitle }));
    await mainMenuMiddleware.replyToContext(ctx, '/');
  } catch (e) {
    ctx.i18n.t('menus.channel.addFailText');
    logger.error(e.stack, { ctx });
  }

  return next();
};
