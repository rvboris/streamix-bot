import { MenuTemplate, createBackMainMenuButtons, MenuMiddleware } from 'telegraf-inline-menu';
import { ActionCode } from '../enums/action-code';
import { Source, Channel, User, Bot, Update } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';

export const adminMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.admin.title'));

  menu.interact((ctx): string => ctx.i18n.t('menus.admin.statBtn'), ActionCode.ADMIN_STAT, {
    do: async (ctx): Promise<string> => {
      if (!ctx.user.isAdmin) {
        return;
      }

      const [usersCount, sourcesCount, channelsCount, botsCount, updatesCount, topSources] = await Promise.all([
        ctx.connection.manager.count(User),
        ctx.connection.manager.count(Source),
        ctx.connection.manager.count(Channel),
        ctx.connection.manager.count(Bot),
        ctx.connection.manager.count(Update),
        ctx.connection
          .createQueryBuilder(Source, 'source')
          .select("substring(source.dataId from '^(?:https?:)?(?://)?(?:[^@\n]+@)?(?:www.)?([^:/\n]+)')", 'domain')
          .addSelect('count(*)', 'count')
          .groupBy('domain')
          .limit(10)
          .orderBy('count', 'DESC')
          .getRawMany(),
      ]);

      const topSourcesString = topSources.map(({ domain, count }): string => `${domain} - ${count}`).join('\n');

      const statText = ctx.i18n.t('menus.admin.statText', {
        usersCount,
        sourcesCount,
        channelsCount,
        botsCount,
        updatesCount,
        topSourcesString,
      });

      await ctx.reply(statText, {
        disable_web_page_preview: false,
      } as any);
    },
    hide: (ctx): boolean => !ctx.user.isAdmin,
  });

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};

export const adminMenuMiddleware = new MenuMiddleware('/', adminMenu());
