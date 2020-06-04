import getUrls from 'get-urls';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';
import { ActionCode } from '../enums/action-code';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { getMenuPath, logger } from '../utils';
import { mainMenuMiddleware } from '../menus';
import { QuestionCode } from '../enums/question-code';
import { RssParser } from '../parsers/rss-parser';
import { Source } from '../entites';
import { SourceType } from '../entites/source';
import { subDays } from 'date-fns';

const ADD_RSS_PATH = getMenuPath(ActionCode.MAIN_SOURCES, ActionCode.SOURCES_LIST);

// https://github.com/sindresorhus/normalize-url#options
const URL_NORMALIZER_PARAMS = {
  stripWWW: false,
  stripAuthentication: false,
  removeTrailingSlash: false,
};

export const addRssQuestion = new TelegrafStatelessQuestion<ExtendedTelegrafContext>(
  QuestionCode.ADD_RSS,
  async (ctx) => {
    const { message } = ctx;
    const { text } = message;

    if (!text) {
      await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
      await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
      return;
    }

    try {
      const urls = getUrls(text, URL_NORMALIZER_PARAMS);

      if (!urls.size) {
        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
        await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceUrl'));
        return;
      }

      const urlsIterator = urls.values();
      const firstUrlItem = urlsIterator.next();
      const firstSource = firstUrlItem.value;

      const [, sourceName = ''] = text.match(/(\S+).+/);

      if (sourceName.length < 3 || sourceName.length > 32) {
        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
        await ctx.reply(ctx.i18n.t('menus.sourcesList.invalidSourceName', { sourceName }));
        return;
      }

      try {
        await new RssParser().try(firstSource);
      } catch (e) {
        logger.error(e.stack, { ctx });

        await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
        await ctx.reply(
          ctx.i18n.t('menus.sourcesList.invalidSourceRecords', {
            url: firstSource,
          }),
          {
            disable_web_page_preview: true,
          } as any,
        );

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
      await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
      await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssFailText'));
      return;
    }

    await mainMenuMiddleware.replyToContext(ctx, ADD_RSS_PATH);
    await ctx.reply(ctx.i18n.t('menus.sourcesList.addRssSuccessText'));
  },
);
