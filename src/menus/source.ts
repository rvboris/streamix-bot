import { logger } from '../utils/logger';
import { ActionCode } from '../enums/action-code';
import { Source } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';

export const sourceMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.source.title'));

  menu.interact((ctx): string => ctx.i18n.t('menus.source.deleteBtn'), ActionCode.SOURCE_DELETE, {
    do: async (ctx): Promise<string> => {
      const [, sourceId] = ctx.match;
      try {
        await ctx.connection.manager.delete(Source, { id: sourceId });
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.answerCbQuery(ctx.i18n.t('menus.source.deleteFailText'));
        return;
      }

      await ctx.answerCbQuery(ctx.i18n.t('menus.source.deleteSuccessText'));

      return '..';
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
