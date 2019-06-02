import { ActionCode } from './ActionCode';
import TelegrafInlineMenu from 'telegraf-inline-menu';
import logger from '../util/logger';
import { Settings } from '../entites/Settings';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.select(ActionCode.LANGUAGE_SELECT, ['ru', 'en'], {
    setFunc: async (ctx, key): Promise<void> => {
      ctx.i18n.locale(key);
      ctx.user.settings.language = key;

      try {
        await ctx.connection.manager.update(Settings, { user: ctx.user }, { language: key });
        await ctx.answerCbQuery(ctx.i18n.t('menus.settings.changeLanguageText'));
      } catch (e) {
        logger.error(e.stack, { ctx });
      }
    },
    isSetFunc: (ctx, key): boolean => key === ctx.user.settings.language,
  });

  return menu;
};
