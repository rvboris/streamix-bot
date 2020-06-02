import { logger } from '../util/logger';
import { ActionCode } from '../enums/ActionCode';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate } from 'telegraf-inline-menu';
import { Settings } from '../entites/Settings';

export const languageMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.select(ActionCode.LANGUAGE_SELECT, ['ru', 'en'], {
    set: async (ctx, key): Promise<void> => {
      ctx.i18n.locale(key);
      ctx.user.settings.language = key;

      try {
        await ctx.connection.manager.update(Settings, { user: ctx.user }, { language: key });
        await ctx.answerCbQuery(ctx.i18n.t('menus.settings.changeLanguageText'));
      } catch (e) {
        logger.error(e.stack, { ctx });
      }
    },
    isSet: (ctx, key): boolean => key === ctx.user.settings.language,
  });

  return menu;
};
