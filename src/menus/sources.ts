import TelegrafInlineMenu from 'telegraf-inline-menu';
import sourcesListMenu from './sourcesList';
import { ContextMessageUpdate } from 'telegraf';
import { ActionCode } from './ActionCode';
import { Source, Bot, Settings } from '../entites';

export default (ctx: ContextMessageUpdate): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.sources.title'));

  const getBotsNames = async (): Promise<string[]> => {
    const userBots = await ctx.connection.manager.find(Bot, { user: ctx.user });
    return userBots.map((bot): string => bot.id.toString());
  };

  menu.select(ActionCode.SOURCES_BOT_SELECT, getBotsNames, {
    isSetFunc: async (ctx, key): Promise<boolean> => {
      const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
      return settings.defaultBot.id === parseInt(key, 10);
    },
    setFunc: async (ctx, key): Promise<void> => {
      const bot = await ctx.connection.manager.findOne(Bot, { id: parseInt(key, 10), user: ctx.user });
      await ctx.connection.manager.update(Settings, { user: ctx.user }, { defaultBot: bot });
    },
    textFunc: async (ctx, key): Promise<string> => {
      const bot = await ctx.connection.manager.findOne(Bot, { id: parseInt(key, 10), user: ctx.user });
      const sourcesCount = await ctx.connection.manager.count(Source, { user: ctx.user, bot });
      return ctx.i18n.t('menus.sources.botSelectBtn', { sources: sourcesCount, botName: bot.username });
    },
    columns: 1,
  });

  const getListBtnText = async (ctx: ContextMessageUpdate): Promise<string> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const botName = settings.defaultBot.username;

    return ctx.i18n.t('menus.sources.sourcesListBtn', { botName });
  };

  menu.submenu(getListBtnText, ActionCode.SOURCES_LIST, sourcesListMenu(ctx));

  return menu;
};
