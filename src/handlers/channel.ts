import getTelegram from '../util/getTelegram';
import logger from '../util/logger';
import { Bot, Channel } from '../entites';
import { Middleware, ContextMessageUpdate } from 'telegraf';
import { get } from 'lodash';

export const channelHandler = (): Middleware<ContextMessageUpdate> => async (ctx, next): Promise<void> => {
  try {
    if (!get(ctx, 'message.forward_from_message_id', false)) {
      return next && next();
    }

    const { id: channelId, title: channelTitle, username: channelUsername } = get(ctx, 'message.forward_from_chat', {});

    if (!channelId || !channelTitle || !channelUsername) {
      return next && next();
    }

    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });

    await Promise.all(
      userBots.map(
        async (bot): Promise<Channel> => {
          const chatMembers = await getTelegram(bot.token).getChatAdministrators(channelId);
          const adminBot = chatMembers.find(
            ({ user }): boolean => {
              return user.is_bot && user.id.toString() === bot.telegramId;
            },
          );

          if (!adminBot) {
            return;
          }

          const channel = await ctx.connection.manager.findOne(Channel, { telegramId: channelId.toString() });

          if (channel) {
            return;
          }

          const newChannel = new Channel();

          newChannel.telegramId = channelId.toString();
          newChannel.username = channelUsername;
          newChannel.title = channelTitle;
          newChannel.bot = bot;

          await ctx.connection.manager.save(newChannel);

          ctx.reply(
            ctx.i18n.t('menus.channel.addSuccessText', {
              channelName: channelUsername,
              botName: bot.username,
            }),
          );

          return newChannel;
        },
      ),
    );
  } catch (e) {
    ctx.i18n.t('menus.channel.addFailText');
    logger.error(e.stack);
  }

  return next && next();
};
