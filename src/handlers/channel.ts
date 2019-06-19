import getTelegram from '../util/getTelegram';
import logger from '../util/logger';
import { Bot, Channel, Settings } from '../entites';
import { Middleware, ContextMessageUpdate } from 'telegraf';
import { get } from 'lodash';

function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

async function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((value, index) => filterMap[index]);
}

export const channelHandler = (): Middleware<ContextMessageUpdate> => async (ctx, next): Promise<void> => {
  try {
    if (!get(ctx, 'message.forward_from_message_id', false)) {
      return next && next();
    }

    const { id: channelId, title: channelTitle, username: channelUsername } = get(ctx, 'message.forward_from_chat', {});

    if (!channelId || !channelTitle) {
      return next && next();
    }

    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });
    const adminBots = await filterAsync<Bot>(userBots, async (bot) => {
      try {
        const chatMembers = await getTelegram(bot.token).getChatAdministrators(channelId);
        const adminBot = chatMembers.find(
          ({ user }): boolean => {
            return user.is_bot && user.id.toString() === bot.telegramId;
          },
        );

        return !!adminBot;
      } catch (e) {
        return false;
      }
    });

    if (!adminBots) {
      return;
    }

    const channel = await ctx.connection.manager.findOne(Channel, { telegramId: channelId.toString() });

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
