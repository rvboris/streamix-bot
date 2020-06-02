import { logger } from '../util/logger';
import { ActionCode } from '../enums/ActionCode';
import { Bot, Channel, Settings } from '../entites';
import { channelsMenu } from './channels';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';

export const botMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.bot.title'));

  menu.submenu((ctx): string => ctx.i18n.t('menus.bot.channelsBtn'), ActionCode.BOT_CHANNELS, channelsMenu(), {
    hide: async (ctx): Promise<boolean> => {
      if (!ctx.match) {
        return false;
      }

      const [, botId = ''] = ctx.match;
      const isAnyChannels = await ctx.connection
        .createQueryBuilder(Channel, 'channel')
        .leftJoinAndSelect('channel.bots', 'bot')
        .where('bot.id = ANY(:botId)', { botId: [parseInt(botId, 10)] })
        .getCount();

      return !isAnyChannels;
    },
  });

  menu.interact((ctx): string => ctx.i18n.t('menus.bot.deleteBtn'), ActionCode.BOT_DELETE, {
    do: async (ctx): Promise<string> => {
      try {
        const [, botId = ''] = ctx.match;

        ctx.connection.manager.transaction(
          async (transactionalEntityManager): Promise<void> => {
            const botToDelete = await transactionalEntityManager.findOne<Bot>(
              Bot,
              { user: ctx.user, id: parseInt(botId, 10) },
              { relations: ['channels'] },
            );

            await transactionalEntityManager.update(
              Settings,
              { user: ctx.user },
              { defaultBot: null, defaultChannel: null },
            );

            await transactionalEntityManager.delete(Bot, { id: botToDelete.id });

            for (const channel of botToDelete.channels) {
              const { bots } = await transactionalEntityManager.findOne(
                Channel,
                { user: ctx.user, id: channel.id },
                { relations: ['bots'] },
              );

              if (!bots.length) {
                await transactionalEntityManager.delete(Channel, {
                  id: channel.id,
                  user: ctx.user,
                });
              }
            }

            const bot = (await transactionalEntityManager.findOne(Bot, { user: ctx.user })) || null;
            const channel =
              (await transactionalEntityManager.findOne(Channel, {
                user: ctx.user,
              })) || null;

            await transactionalEntityManager.update(
              Settings,
              { user: ctx.user },
              { defaultBot: bot, defaultChannel: channel },
            );
          },
        );
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.answerCbQuery(ctx.i18n.t('menus.bot.deleteFailText'));
        return;
      }

      await ctx.answerCbQuery(ctx.i18n.t('menus.bot.deleteSuccessText'));

      return '..';
    },
  });

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};
