import { ActionCode } from '../enums/action-code';
import { createBackMainMenuButtons, MenuTemplate } from 'telegraf-inline-menu';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { logger } from '../utils/logger';
import { Settings } from '../entites/settings';

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

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};
