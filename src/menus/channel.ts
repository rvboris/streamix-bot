import logger from '../util/logger';
import { ActionCode } from '../enums/ActionCode';
import { Channel, Settings } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate } from 'telegraf-inline-menu';

export const channelMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.channel.title'));

  menu.interact((ctx): string => ctx.i18n.t('menus.channel.deleteBtn'), ActionCode.CHANNEL_DELETE, {
    do: async (ctx): Promise<string> => {
      try {
        const [, , channelId = ''] = ctx.match;

        ctx.connection.manager.transaction(
          async (transactionalEntityManager): Promise<void> => {
            if (ctx.user.settings.defaultChannel.id.toString() === channelId) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultChannel: null });
            }

            await transactionalEntityManager.delete(Channel, { id: channelId });

            const channels = await transactionalEntityManager.find(Channel, {
              user: ctx.user,
            });

            if (channels) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultChannel: channels[0] });
            }
          },
        );
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.reply(ctx.i18n.t('menus.channel.deleteFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.channel.deleteSuccessText'));

      return '.';
    },
  });

  return menu;
};
