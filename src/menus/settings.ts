import TelegrafInlineMenu from 'telegraf-inline-menu';
import changeLanguageMenu from './language';
import { ActionCode } from './ActionCode';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.submenu(
    (ctx): string => ctx.i18n.t('menus.settings.changeLanguageBtn'),
    ActionCode.SETTINGS_LANGUAGE,
    changeLanguageMenu(),
  );

  menu.setCommand('settings');

  return menu;
};
