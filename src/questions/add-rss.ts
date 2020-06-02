import getUrls from 'get-urls';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { logger, getMenuPath } from '../util';
import { mainMenuMiddleware } from '../menus';
import { QuestionCode } from '../enums/QuestionCode';
import { ActionCode } from '../enums/ActionCode';
import { RssParser } from '../parsers/RssParser';
import { Source } from '../entites';
import { SourceType } from '../entites/Source';
import { subDays } from 'date-fns';

const ADD_RSS_PATH = getMenuPath(ActionCode.MAIN_SOURCES, ActionCode.SOURCES_LIST);

export const addRssQuestion = new TelegrafStatelessQuestion<ExtendedTelegrafContext>(
  QuestionCode.ADD_RSS,
  async (ctx) => {
    const { message } = ctx;
    const { text } = message;

    if (!text) {
      await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
      await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
      return;
    }

    try {
      const urls = getUrls(text);

      if (!urls.size) {
        await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceUrl'));
        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
        return;
      }

      const urlsIterator = urls.values();
      const firstUrlItem = urlsIterator.next();
      const firstSource = firstUrlItem.value;

      const [, sourceName = ''] = text.match(/(\S+).+/);

      if (sourceName.length < 3 || sourceName.length > 32) {
        await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceName', { sourceName }));
        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
        return;
      }

      try {
        await new RssParser().try(firstSource);
      } catch (e) {
        logger.error(e.stack, { ctx });

        await ctx.reply(
          ctx.i18n.t('menus.sourcesList.invalidSourceRecords', {
            url: firstSource,
          }),
          {
            disable_web_page_preview: true,
          } as any,
        );
        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);

        return;
      }

      const newSource = new Source();
      const timeAgo = subDays(new Date(), 90);

      newSource.name = sourceName;
      newSource.type = SourceType.RSS;
      newSource.dataId = firstSource;
      newSource.user = ctx.user;
      newSource.channel = ctx.user.settings.defaultChannel;
      newSource.checked = timeAgo;

      await ctx.connection.manager.save(newSource);
    } catch (e) {
      logger.error(e.stack, { ctx });
      await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
      await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
      return;
    }

    await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssSuccessText'));
    await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
  },
);
