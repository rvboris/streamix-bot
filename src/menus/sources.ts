import TelegrafInlineMenu from 'telegraf-inline-menu';
import sourcesListMenu from './sourcesList';
import { ContextMessageUpdate } from 'telegraf';
import { ActionCode } from './ActionCode';
import { Source, Settings, Channel } from '../entites';

export default (ctx: ContextMessageUpdate): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.sources.title'));

  const getChannelsNames = async (ctx: ContextMessageUpdate): Promise<string[]> => {
    const userChannels = await ctx.connection.manager.find(Channel, { user: ctx.user });
    return userChannels.map(({ id }): string => id.toString());
  };

  menu.select(ActionCode.SOURCES_CHANNEL_SELECT, getChannelsNames, {
    isSetFunc: async (ctx, key): Promise<boolean> => {
      const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
      return settings.defaultChannel.id === parseInt(key, 10);
    },
    setFunc: async (ctx, key): Promise<void> => {
      const channel = await ctx.connection.manager.findOne(Channel, { id: parseInt(key, 10), user: ctx.user });
      await ctx.connection.manager.update(Settings, { user: ctx.user }, { defaultChannel: channel });
    },
    textFunc: async (ctx, key): Promise<string> => {
      const channel = await ctx.connection.manager.findOne(Channel, { id: parseInt(key, 10), user: ctx.user });
      const sourcesCount = await ctx.connection.manager.count(Source, { user: ctx.user, channel });
      return ctx.i18n.t('menus.sources.channelSelectBtn', { sources: sourcesCount, channelName: channel.name });
    },
    columns: 1,
  });

  const getListBtnText = async (ctx: ContextMessageUpdate): Promise<string> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const channelName = settings.defaultChannel.name;

    return ctx.i18n.t('menus.sources.sourcesListBtn', { channelName });
  };

  menu.submenu(getListBtnText, ActionCode.SOURCES_LIST, sourcesListMenu(ctx));

  menu.setCommand('sources');

  return menu;
};
