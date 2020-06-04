import { ActionCode } from '../enums/action-code';
import { Bot } from '../entites';
import { botMenu } from './bot';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';

export const botsMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.bots.title'));

  const getBotsNames = async (ctx: ExtendedTelegrafContext): Promise<string[]> => {
    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });
    return userBots.map((bot): string => `${bot.id}`);
  };

  menu.chooseIntoSubmenu(ActionCode.BOTS_SELECT, getBotsNames, botMenu(), {
    buttonText: async (ctx, key): Promise<string> => {
      const bot = await ctx.connection.manager.findOne(Bot, {
        id: parseInt(key, 10),
        user: ctx.user,
      });

      return ctx.i18n.t('menus.bots.selectBtn', { botName: bot.username });
    },
    columns: 1,
  });

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};
