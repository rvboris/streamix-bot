import { ActionCode } from '../enums/ActionCode';
import { Channel, Settings, Source } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';
import { sourcesListMenu } from './sourcesList';

export const sourcesMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.sources.title'));

  const getChannelsNames = async (ctx: ExtendedTelegrafContext): Promise<string[]> => {
    const userChannels = await ctx.connection.manager.find(Channel, { user: ctx.user });
    return userChannels.map(({ id }): string => `${id}`);
  };

  menu.select(ActionCode.SOURCES_CHANNEL_SELECT, getChannelsNames, {
    isSet: async (ctx, key): Promise<boolean> => {
      const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
      return settings.defaultChannel.id === parseInt(key, 10);
    },
    set: async (ctx, key): Promise<void> => {
      const channel = await ctx.connection.manager.findOne(Channel, {
        id: parseInt(key, 10),
        user: ctx.user,
      });

      await ctx.connection.manager.update(Settings, { user: ctx.user }, { defaultChannel: channel });
    },
    buttonText: async (ctx, key): Promise<string> => {
      const channel = await ctx.connection.manager.findOne(Channel, {
        id: parseInt(key, 10),
        user: ctx.user,
      });

      const sourcesCount = await ctx.connection.manager.count(Source, {
        user: ctx.user,
        channel,
      });

      return ctx.i18n.t('menus.sources.channelSelectBtn', {
        sources: sourcesCount,
        channelName: channel.name,
      });
    },
    columns: 1,
  });

  const getListBtnText = async (ctx: ExtendedTelegrafContext): Promise<string> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const channelName = settings.defaultChannel.name;

    return ctx.i18n.t('menus.sources.sourcesListBtn', { channelName });
  };

  menu.submenu(getListBtnText, ActionCode.SOURCES_LIST, sourcesListMenu());

  menu.interact((ctx): string => ctx.i18n.t('menus.main.howToAddChannelBtn'), ActionCode.MAIN_ADD_CHANNEL, {
    do: async (ctx): Promise<void> => {
      await ctx.reply(ctx.i18n.t('menus.main.howToAddChannelText'));
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
