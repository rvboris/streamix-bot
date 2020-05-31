import { languageMenu } from './language';
import { ActionCode } from '../enums/ActionCode';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate } from 'telegraf-inline-menu';

export const settingsMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.submenu(
    (ctx): string => ctx.i18n.t('menus.settings.changeLanguageBtn'),
    ActionCode.SETTINGS_LANGUAGE,
    languageMenu(),
  );

  return menu;
};
