import { MenuTemplate, createBackMainMenuButtons, MenuMiddleware } from 'telegraf-inline-menu';
import { ActionCode } from '../enums/action-code';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { mainMenuMiddleware } from './main';
import { getMenuPath } from '../utils';

export const helpMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.help.title'));

  menu.interact((ctx): string => ctx.i18n.t('menus.help.howToAddChannelBtn'), ActionCode.HELP_ADD_CHANNEL, {
    do: async (ctx): Promise<void> => {
      await mainMenuMiddleware.replyToContext(ctx, getMenuPath(ActionCode.MAIN_HELP));
      await ctx.reply(ctx.i18n.t('menus.help.howToAddChannelText'));
    },
  });

  menu.interact((ctx): string => ctx.i18n.t('menus.help.howToAddBotBtn'), ActionCode.HELP_ADD_BOTS, {
    do: async (ctx): Promise<void> => {
      await mainMenuMiddleware.replyToContext(ctx, getMenuPath(ActionCode.MAIN_HELP));
      await ctx.reply(ctx.i18n.t('menus.help.howToAddBotText'));
    },
  });

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};

export const helpMenuMiddleware = new MenuMiddleware('/', helpMenu());
