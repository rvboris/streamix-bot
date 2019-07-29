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

      const usersCount = await ctx.connection.manager.count(User);
      const sourcesCount = await ctx.connection.manager.count(Source);
      const channelsCount = await ctx.connection.manager.count(Channel);
      const botsCount = await ctx.connection.manager.count(Bot);
      const topSources = await ctx.connection
        .createQueryBuilder(Source, 'source')
        .select("substring(source.dataId from '^(?:https?:)?(?://)?(?:[^@\n]+@)?(?:www.)?([^:/\n]+)')", 'domain')
        .addSelect('count(*)', 'count')
        .groupBy('domain')
        .limit(10)
        .getRawMany();

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
