import TelegrafInlineMenu from 'telegraf-inline-menu';
import { ActionCode } from './ActionCode';
import { Channel } from '../entites';
import logger from '../util/logger';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.channel.title'));

  menu.button((ctx): string => ctx.i18n.t('menus.channel.deleteBtn'), ActionCode.CHANNEL_DELETE, {
    doFunc: async (ctx): Promise<void> => {
      try {
        const [, , channelId = ''] = ctx.match;
        await ctx.connection.manager.delete(Channel, { id: channelId });
      } catch (e) {
        logger.error(e.stack, ctx);
        await ctx.reply(ctx.i18n.t('menus.channel.deleteFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.channel.deleteSuccessText'));
    },
    setParentMenuAfter: true,
  });

  return menu;
};
