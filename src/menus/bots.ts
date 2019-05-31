import TelegrafInlineMenu from 'telegraf-inline-menu';
import botMenu from './bot';
import { ContextMessageUpdate } from 'telegraf';
import { ActionCode } from './ActionCode';
import { Bot, Source } from '../entites';

export default (ctx: ContextMessageUpdate): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.bots.title'));

  const getBotsNames = async (): Promise<string[]> => {
    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });
    return userBots.map((bot): string => bot.id.toString());
  };

  menu.selectSubmenu(ActionCode.BOTS_SELECT, getBotsNames, botMenu(), {
    textFunc: async (ctx, key): Promise<string> => {
      const bot = await ctx.connection.manager.findOne(Bot, { id: parseInt(key, 10), user: ctx.user });
      const sourcesCount = await ctx.connection.manager.count(Source, { user: ctx.user, bot });

      return ctx.i18n.t('menus.bots.selectBtn', { botName: bot.username, sources: sourcesCount });
    },
    columns: 1,
  });

  menu.simpleButton((ctx): string => ctx.i18n.t('menus.bots.addBtn'), ActionCode.BOTS_ADD, {
    doFunc: async (ctx): Promise<void> => {
      await ctx.reply(ctx.i18n.t('menus.bots.howToAdd'));
    },
  });

  menu.setCommand('bots');

  return menu;
};
