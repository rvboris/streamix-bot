import { sourceMenu } from './source';
import { ActionCode } from '../enums/action-code';
import { addRssQuestion } from '../questions/add-rss';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';
import { Settings, Source } from '../entites';
import { SourceType } from '../entites/source';

export const sourcesListMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const getMenuTitle = async (ctx: ExtendedTelegrafContext): Promise<string> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const channelName = settings.defaultChannel.name;

    return ctx.i18n.t('menus.sourcesList.title', { channelName });
  };

  const menu = new MenuTemplate<ExtendedTelegrafContext>(getMenuTitle);

  const getSourcesNames = async (ctx: ExtendedTelegrafContext): Promise<string[]> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const userSources = await ctx.connection.manager.find(Source, {
      user: ctx.user,
      channel: settings.defaultChannel,
    });

    return userSources ? userSources.map(({ id }): string => `${id}`) : [];
  };

  menu.chooseIntoSubmenu(ActionCode.SOURCES_LIST_SELECT, getSourcesNames, sourceMenu(), {
    buttonText: async (ctx, key): Promise<string> => {
      const source = await ctx.connection.manager.findOne(Source, {
        id: parseInt(key, 10),
        user: ctx.user,
      });

      return ctx.i18n.t('menus.sourcesList.sourceSelectBtn', {
        sourceName: source.name,
        sourceType: SourceType[source.type],
      });
    },
    columns: 1,
  });

  menu.interact((ctx): string => ctx.i18n.t('menus.sourcesList.addRssBtn'), ActionCode.SOURCES_LIST_ADD_RSS, {
    do: async (ctx): Promise<void> => {
      await addRssQuestion.replyWithMarkdown(ctx, ctx.i18n.t('menus.sourcesList.addRssQuestion'));
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
