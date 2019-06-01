import TelegrafInlineMenu from 'telegraf-inline-menu';
import { ActionCode } from './ActionCode';
import { Bot, Settings, Channel } from '../entites';
import channelsMenu from './channels';
import logger from '../util/logger';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.bot.title'));

  menu.submenu((ctx): string => ctx.i18n.t('menus.bot.channelsBtn'), ActionCode.BOT_CHANNELS, channelsMenu(), {
    hide: async (ctx): Promise<boolean> => {
      if (!ctx.match) {
        return false;
      }

      const [, botId = ''] = ctx.match;
      const isAnyChannels = await ctx.connection
        .createQueryBuilder(Channel, 'channel')
        .leftJoinAndSelect('channel.bot', 'bot')
        .where('bot.id = :botId', { botId })
        .getCount();

      return !isAnyChannels;
    },
  });

  menu.button((ctx): string => ctx.i18n.t('menus.bot.deleteBtn'), ActionCode.BOT_DELETE, {
    doFunc: async (ctx): Promise<void> => {
      try {
        const [, botId = ''] = ctx.match;

        ctx.connection.manager.transaction(
          async (transactionalEntityManager): Promise<void> => {
            if (ctx.user.settings.defaultBot.id.toString() === botId) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultBot: null });
            }

            await transactionalEntityManager.delete(Bot, { id: botId });

            const bots = await transactionalEntityManager.find(Bot, { user: ctx.user });

            if (bots) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultBot: bots[0] });
            }
          },
        );
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.reply(ctx.i18n.t('menus.bot.deleteFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.bot.deleteSuccessText'));
    },
    setParentMenuAfter: true,
  });

  return menu;
};
