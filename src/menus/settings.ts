import { languageMenu } from './language';
import { ActionCode } from '../enums/action-code';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';

export const settingsMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.submenu(
    (ctx): string => ctx.i18n.t('menus.settings.changeLanguageBtn'),
    ActionCode.SETTINGS_LANGUAGE,
    languageMenu(),
  );

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};
