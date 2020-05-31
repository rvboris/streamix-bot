import getTelegram from '../util/getTelegram';
import logger from '../util/logger';
import { Bot, Channel, Settings } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { filterAsync } from '../util/filterAsync';
import { get } from 'lodash';
import { Middleware } from 'telegraf';

export const channelHandler = (): Middleware<ExtendedTelegrafContext> => async (
  ctx: ExtendedTelegrafContext,
  next: () => void,
): Promise<void> => {
  try {
    if (!get(ctx, 'message.forward_from_message_id', false)) {
      return next && next();
    }

    const { id: channelId, title: channelTitle, username: channelUsername } = get(ctx, 'message.forward_from_chat', {});

    if (!channelId || !channelTitle) {
      return next && next();
    }

    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });

    if (!userBots.length) {
      return;
    }

    const adminBots = await filterAsync<Bot>(
      userBots,
      async (bot): Promise<boolean> => {
        try {
          const chatMembers = await getTelegram(bot.token).getChatAdministrators(channelId);
          const adminBot = chatMembers.find(({ user }): boolean => {
            return user.is_bot && user.id.toString() === bot.telegramId;
          });

          return !!adminBot;
        } catch (e) {
          return false;
        }
      },
    );

    if (!adminBots.length) {
      return;
    }

    const channel = await ctx.connection.manager.findOne(Channel, {
      telegramId: channelId.toString(),
    });

    if (channel) {
      return;
    }

    await ctx.connection.manager.transaction(
      async (transactionalEntityManager): Promise<void> => {
        const newChannel = new Channel();

        newChannel.telegramId = channelId.toString();

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
  } catch (e) {
    ctx.i18n.t('menus.channel.addFailText');
    logger.error(e.stack);
  }

  return next && next();
};
