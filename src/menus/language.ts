import { ActionCode } from './ActionCode';
import TelegrafInlineMenu from 'telegraf-inline-menu';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.settings.title'));

  menu.select(ActionCode.LANGUAGE_SELECT, ['ru', 'en'], {
    setFunc: async (ctx, key): Promise<void> => {
      ctx.i18n.locale(key);
      ctx.user.settings.language = key;

      await ctx.connection.manager.save(ctx.user);
      await ctx.answerCbQuery(ctx.i18n.t('menus.settings.changeLanguageText'));
    },
    isSetFunc: (ctx, key): boolean => key === ctx.user.settings.language,
  });

  return menu;
};
