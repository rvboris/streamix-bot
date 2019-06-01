import TelegrafInlineMenu from 'telegraf-inline-menu';
import logger from '../util/logger';
import { ActionCode } from './ActionCode';
import { Source } from '../entites';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.source.title'));

  menu.button((ctx): string => ctx.i18n.t('menus.source.deleteBtn'), ActionCode.SOURCE_DELETE, {
    doFunc: async (ctx): Promise<void> => {
      const [, sourceId] = ctx.match;
      try {
        await ctx.connection.manager.delete(Source, { id: sourceId });
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.reply(ctx.i18n.t('menus.source.deleteFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.source.deleteSuccessText'));
    },
    setParentMenuAfter: true,
  });

  return menu;
};
