import TelegrafInlineMenu from 'telegraf-inline-menu';
import SourceMenu from './source';
import getUrls from 'get-urls';
import Parser from 'rss-parser';
import logger from '../util/logger';
import { ContextMessageUpdate } from 'telegraf';
import { ActionCode } from './ActionCode';
import { Source, Settings } from '../entites';
import { SourceType } from '../entites/Source';

export default (ctx: ContextMessageUpdate): TelegrafInlineMenu => {
  const getMenuTitle = async (ctx: ContextMessageUpdate): Promise<string> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const botName = settings.defaultBot.username;

    return ctx.i18n.t('menus.sourcesList.title', { botName });
  };

  const menu = new TelegrafInlineMenu(getMenuTitle);

  const getSourcesNames = async (): Promise<string[]> => {
    const settings = await ctx.connection.manager.findOne(Settings, { user: ctx.user });
    const userSources = await ctx.connection.manager.find(Source, { user: ctx.user, bot: settings.defaultBot });

    return userSources ? userSources.map((source): string => source.id.toString()) : [];
  };

  menu.selectSubmenu(ActionCode.SOURCES_LIST_SELECT, getSourcesNames, SourceMenu(), {
    textFunc: async (ctx, key): Promise<string> => {
      const source = await ctx.connection.manager.findOne(Source, { id: parseInt(key, 10), user: ctx.user });
      return ctx.i18n.t('menus.sourcesList.sourceSelectBtn', {
        sourceName: source.name,
        sourceType: SourceType[source.type],
      });
    },
    columns: 1,
  });

  menu.question((ctx): string => ctx.i18n.t('menus.sourcesList.addRssBtn'), ActionCode.SOURCES_LIST_ADD_RSS, {
    questionText: ctx.i18n.t('menus.sourcesList.addRssQuestion'),
    setFunc: async (ctx, answer): Promise<void> => {
      if (!answer) {
        await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
        return;
      }

      try {
        const urls = getUrls(answer);

        if (!urls.size) {
          await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceUrl'));
          return;
        }

        const urlsIterator = urls.values();
        const firstUrlItem = urlsIterator.next();
        const firstSource = firstUrlItem.value;

        const [, sourceName = ''] = answer.match(/(\S+).+/);

        if (sourceName.length < 3 || sourceName.length > 32) {
          await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceName', { sourceName }));
          return;
        }

        try {
          await new Parser().parseURL(firstSource);
        } catch (e) {
          logger.error(e.stack, { ctx });
          await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceRecords', { url: firstSource }), {
            disable_web_page_preview: true,
          } as any);
          return;
        }

        const newSource = new Source();

        newSource.name = sourceName;
        newSource.type = SourceType.RSS;
        newSource.url = firstSource;
        newSource.user = ctx.user;
        newSource.bot = ctx.user.settings.defaultBot;
        newSource.checked = new Date();

        await ctx.connection.manager.save(newSource);
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssSuccessText'));
    },
  });

  return menu;
};
