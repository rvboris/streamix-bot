import TelegrafInlineMenu from 'telegraf-inline-menu';
import { ActionCode } from './ActionCode';
import { Source, Channel, User, Bot } from '../entites';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.admin.title'));

  menu.simpleButton((ctx): string => ctx.i18n.t('menus.admin.statBtn'), ActionCode.ADMIN_STAT, {
    doFunc: async (ctx): Promise<void> => {
      if (!ctx.user.isAdmin) {
        return;
      }

      const [usersCount, sourcesCount, channelsCount, botsCount, topSources] = await Promise.all([
        ctx.connection.manager.count(User),
        ctx.connection.manager.count(Source),
        ctx.connection.manager.count(Channel),
        ctx.connection.manager.count(Bot),
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
        topSourcesString,
      });

      await ctx.reply(statText, {
        disable_web_page_preview: false,
      } as any);
    },
    hide: (ctx): boolean => !ctx.user.isAdmin,
  });

  return menu;
};
